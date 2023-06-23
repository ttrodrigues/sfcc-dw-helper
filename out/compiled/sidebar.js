var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/webviews/components/ShowIcon.svelte generated by Svelte v3.55.1 */

    const file$2 = "src/webviews/components/ShowIcon.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z");
    			add_location(path0, file$2, 1, 4, 120);
    			attr_dev(path1, "d", "M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z");
    			add_location(path1, file$2, 2, 4, 462);
    			attr_dev(svg, "class", "svgShowIcon");
    			set_style(svg, "width", "28px");
    			set_style(svg, "height", "24px");
    			set_style(svg, "position", "relative");
    			set_style(svg, "top", "12px");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "#fff");
    			add_location(svg, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ShowIcon', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ShowIcon> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ShowIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShowIcon",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/webviews/components/HideIcon.svelte generated by Svelte v3.55.1 */

    const file$1 = "src/webviews/components/HideIcon.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			attr_dev(path0, "d", "M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z");
    			add_location(path0, file$1, 1, 4, 120);
    			attr_dev(path1, "d", "M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z");
    			add_location(path1, file$1, 2, 2, 396);
    			attr_dev(path2, "d", "M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z");
    			add_location(path2, file$1, 3, 2, 578);
    			attr_dev(svg, "class", "svgHideIcon");
    			set_style(svg, "width", "28px");
    			set_style(svg, "height", "24px");
    			set_style(svg, "position", "relative");
    			set_style(svg, "top", "12px");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "#fff");
    			add_location(svg, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HideIcon', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HideIcon> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class HideIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HideIcon",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/webviews/components/Sidebar.svelte generated by Svelte v3.55.1 */
    const file = "src/webviews/components/Sidebar.svelte";

    // (232:8) {#if isProphetInstalled}
    function create_if_block(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div4;
    	let div1;
    	let button0;
    	let t3;
    	let div2;
    	let button1;
    	let t5;
    	let div3;
    	let button2;
    	let mounted;
    	let dispose;
    	let if_block0 = /*isToShowDevBuildBtn*/ ctx[2] && create_if_block_2(ctx);
    	let if_block1 = /*isToShowPrdBuildBtn*/ ctx[5] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Clean Project / Upload All";
    			t3 = space();
    			div2 = element("div");
    			button1 = element("button");
    			button1.textContent = "Enable Upload";
    			t5 = space();
    			div3 = element("div");
    			button2 = element("button");
    			button2.textContent = "Disable Upload";
    			attr_dev(div0, "id", "commandsBtn");
    			attr_dev(div0, "class", "svelte-dyz7e7");
    			add_location(div0, file, 232, 12, 6481);
    			attr_dev(button0, "class", "btn-prophet monaco-button monaco-text-button svelte-dyz7e7");
    			add_location(button0, file, 251, 20, 7305);
    			add_location(div1, file, 250, 16, 7278);
    			attr_dev(button1, "class", "btn-prophet monaco-button monaco-text-button svelte-dyz7e7");
    			add_location(button1, file, 257, 20, 7580);
    			add_location(div2, file, 256, 16, 7553);
    			attr_dev(button2, "class", "btn-prophet monaco-button monaco-text-button svelte-dyz7e7");
    			add_location(button2, file, 263, 20, 7823);
    			add_location(div3, file, 262, 16, 7796);
    			attr_dev(div4, "id", "prophetBtn");
    			attr_dev(div4, "class", "svelte-dyz7e7");
    			add_location(div4, file, 249, 12, 7239);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, button0);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, button1);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[25], false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[26], false, false, false),
    					listen_dev(button2, "click", /*click_handler_5*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*isToShowDevBuildBtn*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*isToShowPrdBuildBtn*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(232:8) {#if isProphetInstalled}",
    		ctx
    	});

    	return block;
    }

    // (234:16) {#if isToShowDevBuildBtn}
    function create_if_block_2(ctx) {
    	let div;
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(/*textLayoutDevBuildBtn*/ ctx[4]);
    			attr_dev(button, "class", "btn-build monaco-button monaco-text-button svelte-dyz7e7");
    			add_location(button, file, 235, 24, 6599);
    			add_location(div, file, 234, 20, 6568);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[23], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*textLayoutDevBuildBtn*/ 16) set_data_dev(t, /*textLayoutDevBuildBtn*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(234:16) {#if isToShowDevBuildBtn}",
    		ctx
    	});

    	return block;
    }

    // (242:16) {#if isToShowPrdBuildBtn}
    function create_if_block_1(ctx) {
    	let div;
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(/*textLayoutPrdBuildBtn*/ ctx[7]);
    			attr_dev(button, "class", "btn-build monaco-button monaco-text-button svelte-dyz7e7");
    			add_location(button, file, 243, 24, 6951);
    			add_location(div, file, 242, 20, 6920);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[24], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*textLayoutPrdBuildBtn*/ 128) set_data_dev(t, /*textLayoutPrdBuildBtn*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(242:16) {#if isToShowPrdBuildBtn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div5;
    	let div0;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let t4;
    	let input1;
    	let t5;
    	let div2;
    	let t7;
    	let input2;
    	let t8;
    	let div4;
    	let div3;
    	let t10;
    	let input3;
    	let input3_type_value;
    	let t11;
    	let switch_instance;
    	let t12;
    	let button0;
    	let t13;
    	let t14;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*componentSelected*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	let if_block = /*isProphetInstalled*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			div0.textContent = "Hostname";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "Code Version";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "User Name";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div3.textContent = "Password";
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t12 = space();
    			button0 = element("button");
    			t13 = space();
    			if (if_block) if_block.c();
    			t14 = space();
    			button1 = element("button");
    			button1.textContent = "TESTE";
    			add_location(div0, file, 203, 8, 5572);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "hostname");
    			attr_dev(input0, "class", "svelte-dyz7e7");
    			add_location(input0, file, 204, 8, 5601);
    			add_location(div1, file, 209, 8, 5756);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "codeVersion");
    			attr_dev(input1, "class", "svelte-dyz7e7");
    			add_location(input1, file, 210, 8, 5789);
    			add_location(div2, file, 214, 8, 5901);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", "userName");
    			attr_dev(input2, "class", "svelte-dyz7e7");
    			add_location(input2, file, 215, 8, 5931);
    			add_location(div3, file, 220, 12, 6059);
    			attr_dev(input3, "type", input3_type_value = /*isPasswordVisible*/ ctx[9] ? "text" : "password");
    			attr_dev(input3, "id", "password");
    			attr_dev(input3, "class", "svelte-dyz7e7");
    			add_location(input3, file, 221, 12, 6092);
    			attr_dev(button0, "id", "btnSvg");
    			attr_dev(button0, "class", "svelte-dyz7e7");
    			add_location(button0, file, 226, 12, 6311);
    			add_location(div4, file, 219, 8, 6040);
    			attr_dev(button1, "class", "btn-prophet monaco-button monaco-text-button svelte-dyz7e7");
    			add_location(button1, file, 270, 8, 8068);
    			attr_dev(div5, "id", "main");
    			attr_dev(div5, "class", "svelte-dyz7e7");
    			add_location(div5, file, 201, 0, 5545);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div5, t1);
    			append_dev(div5, input0);
    			append_dev(div5, t2);
    			append_dev(div5, div1);
    			append_dev(div5, t4);
    			append_dev(div5, input1);
    			append_dev(div5, t5);
    			append_dev(div5, div2);
    			append_dev(div5, t7);
    			append_dev(div5, input2);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div4, t10);
    			append_dev(div4, input3);
    			append_dev(div4, t11);
    			if (switch_instance) mount_component(switch_instance, div4, null);
    			append_dev(div4, t12);
    			append_dev(div4, button0);
    			append_dev(div5, t13);
    			if (if_block) if_block.m(div5, null);
    			append_dev(div5, t14);
    			append_dev(div5, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[18], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[19], false, false, false),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[20], false, false, false),
    					listen_dev(input3, "change", /*change_handler_3*/ ctx[21], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[22], false, false, false),
    					listen_dev(button1, "click", /*click_handler_6*/ ctx[28], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*isPasswordVisible*/ 512 && input3_type_value !== (input3_type_value = /*isPasswordVisible*/ ctx[9] ? "text" : "password")) {
    				attr_dev(input3, "type", input3_type_value);
    			}

    			if (switch_value !== (switch_value = /*componentSelected*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div4, t12);
    				} else {
    					switch_instance = null;
    				}
    			}

    			if (/*isProphetInstalled*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div5, t14);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (switch_instance) destroy_component(switch_instance);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);
    	let componentSelected = ShowIcon;
    	let isProphetInstalled;
    	let isToShowDevBuildBtn;
    	let textCommandDevBuildBtn;
    	let textLayoutDevBuildBtn;
    	let isToShowPrdBuildBtn;
    	let textCommandPrdBuildBtn;
    	let textLayoutPrdBuildBtn;
    	let codeversionConstant;
    	let hostnameConstant;

    	// To change the visibility of password field
    	let isPasswordVisible = false;

    	onMount(() => {
    		const hostnameInput = document.getElementById('hostname');
    		const usernameInput = document.getElementById('userName');
    		const passwordInput = document.getElementById('password');
    		const codeversionInput = document.getElementById('codeVersion');

    		usernameInput === null || usernameInput === void 0
    		? void 0
    		: usernameInput.value = initUsername;

    		passwordInput === null || passwordInput === void 0
    		? void 0
    		: passwordInput.value = initPassword;

    		hostnameInput === null || hostnameInput === void 0
    		? void 0
    		: hostnameInput.value = initHostname;

    		codeversionInput === null || codeversionInput === void 0
    		? void 0
    		: codeversionInput.value = initCodeversion;

    		$$invalidate(1, isProphetInstalled = isProphetInstall);
    		$$invalidate(2, isToShowDevBuildBtn = showDevBuildBtn);
    		$$invalidate(3, textCommandDevBuildBtn = commandDevBuildBtn);
    		$$invalidate(5, isToShowPrdBuildBtn = showPrdBuildBtn);
    		$$invalidate(6, textCommandPrdBuildBtn = commandPrdBuildBtn);
    		$$invalidate(4, textLayoutDevBuildBtn = textDevBuildBtn);
    		$$invalidate(7, textLayoutPrdBuildBtn = textPrdBuildBtn);
    		codeversionConstant = codeversion;
    		$$invalidate(8, hostnameConstant = hostname);
    	});

    	const changeJsonFile = () => {
    		var _a, _b, _c, _d;

    		const hostname = (_a = document.getElementById('hostname')) === null || _a === void 0
    		? void 0
    		: _a.value;

    		const username = (_b = document.getElementById('userName')) === null || _b === void 0
    		? void 0
    		: _b.value;

    		const password = (_c = document.getElementById('password')) === null || _c === void 0
    		? void 0
    		: _c.value;

    		const codeversion = (_d = document.getElementById('codeVersion')) === null || _d === void 0
    		? void 0
    		: _d.value;

    		const jsonContent = {
    			hostname,
    			username,
    			password,
    			"code-version": codeversion
    		};

    		tsvscode.postMessage({ type: 'onChangeFile', value: jsonContent });
    	};

    	const clickBtnCleanUpload = () => {
    		tsvscode.postMessage({ type: 'onCleanUpload', value: true });
    	};

    	const clickBtnDisableUpload = () => {
    		tsvscode.postMessage({ type: 'onDisableUpload', value: true });
    	};

    	const clickBtnEnableUpload = () => {
    		tsvscode.postMessage({ type: 'onEnableUpload', value: true });
    	};

    	const clickBtnBuild = option => {
    		tsvscode.postMessage({ type: 'onBuild', value: option });
    	};

    	const changeProperty = input => {
    		tsvscode.postMessage({ type: 'onChangeProperty', value: input });
    	};

    	const clickBtnHistory = property => {
    		tsvscode.postMessage({ type: 'onShowQuickPick', value: property });
    	};

    	function buttonClick() {
    		$$invalidate(9, isPasswordVisible = !isPasswordVisible);
    		$$invalidate(0, componentSelected = isPasswordVisible ? HideIcon : ShowIcon);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => {
    		changeJsonFile();
    		changeProperty(e.target.value);
    	};

    	const change_handler_1 = () => {
    		changeJsonFile();
    	};

    	const change_handler_2 = () => {
    		changeJsonFile();
    	};

    	const change_handler_3 = () => {
    		changeJsonFile();
    	};

    	const click_handler = () => {
    		buttonClick();
    	};

    	const click_handler_1 = () => {
    		clickBtnBuild(textCommandDevBuildBtn);
    	};

    	const click_handler_2 = () => {
    		clickBtnBuild(textCommandPrdBuildBtn);
    	};

    	const click_handler_3 = () => {
    		clickBtnCleanUpload();
    	};

    	const click_handler_4 = () => {
    		clickBtnEnableUpload();
    	};

    	const click_handler_5 = () => {
    		clickBtnDisableUpload();
    	};

    	const click_handler_6 = () => {
    		clickBtnHistory(hostnameConstant);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		ShowIcon,
    		HideIcon,
    		componentSelected,
    		isProphetInstalled,
    		isToShowDevBuildBtn,
    		textCommandDevBuildBtn,
    		textLayoutDevBuildBtn,
    		isToShowPrdBuildBtn,
    		textCommandPrdBuildBtn,
    		textLayoutPrdBuildBtn,
    		codeversionConstant,
    		hostnameConstant,
    		isPasswordVisible,
    		changeJsonFile,
    		clickBtnCleanUpload,
    		clickBtnDisableUpload,
    		clickBtnEnableUpload,
    		clickBtnBuild,
    		changeProperty,
    		clickBtnHistory,
    		buttonClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('componentSelected' in $$props) $$invalidate(0, componentSelected = $$props.componentSelected);
    		if ('isProphetInstalled' in $$props) $$invalidate(1, isProphetInstalled = $$props.isProphetInstalled);
    		if ('isToShowDevBuildBtn' in $$props) $$invalidate(2, isToShowDevBuildBtn = $$props.isToShowDevBuildBtn);
    		if ('textCommandDevBuildBtn' in $$props) $$invalidate(3, textCommandDevBuildBtn = $$props.textCommandDevBuildBtn);
    		if ('textLayoutDevBuildBtn' in $$props) $$invalidate(4, textLayoutDevBuildBtn = $$props.textLayoutDevBuildBtn);
    		if ('isToShowPrdBuildBtn' in $$props) $$invalidate(5, isToShowPrdBuildBtn = $$props.isToShowPrdBuildBtn);
    		if ('textCommandPrdBuildBtn' in $$props) $$invalidate(6, textCommandPrdBuildBtn = $$props.textCommandPrdBuildBtn);
    		if ('textLayoutPrdBuildBtn' in $$props) $$invalidate(7, textLayoutPrdBuildBtn = $$props.textLayoutPrdBuildBtn);
    		if ('codeversionConstant' in $$props) codeversionConstant = $$props.codeversionConstant;
    		if ('hostnameConstant' in $$props) $$invalidate(8, hostnameConstant = $$props.hostnameConstant);
    		if ('isPasswordVisible' in $$props) $$invalidate(9, isPasswordVisible = $$props.isPasswordVisible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		componentSelected,
    		isProphetInstalled,
    		isToShowDevBuildBtn,
    		textCommandDevBuildBtn,
    		textLayoutDevBuildBtn,
    		isToShowPrdBuildBtn,
    		textCommandPrdBuildBtn,
    		textLayoutPrdBuildBtn,
    		hostnameConstant,
    		isPasswordVisible,
    		changeJsonFile,
    		clickBtnCleanUpload,
    		clickBtnDisableUpload,
    		clickBtnEnableUpload,
    		clickBtnBuild,
    		changeProperty,
    		clickBtnHistory,
    		buttonClick,
    		change_handler,
    		change_handler_1,
    		change_handler_2,
    		change_handler_3,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    // @ts-ignore
    const app = new Sidebar({
        // @ts-ignore
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=sidebar.js.map
