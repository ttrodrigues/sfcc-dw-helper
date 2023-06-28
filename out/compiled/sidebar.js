var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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

    const file$4 = "src/webviews/components/ShowIcon.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M7.99993 6.00316C9.47266 6.00316 10.6666 7.19708 10.6666 8.66981C10.6666 10.1426 9.47266 11.3365 7.99993 11.3365C6.52715 11.3365 5.33324 10.1426 5.33324 8.66981C5.33324 7.19708 6.52715 6.00316 7.99993 6.00316ZM7.99993 7.00315C7.07946 7.00315 6.33324 7.74935 6.33324 8.66981C6.33324 9.59028 7.07946 10.3365 7.99993 10.3365C8.9204 10.3365 9.6666 9.59028 9.6666 8.66981C9.6666 7.74935 8.9204 7.00315 7.99993 7.00315ZM7.99993 3.66675C11.0756 3.66675 13.7307 5.76675 14.4673 8.70968C14.5344 8.97755 14.3716 9.24908 14.1037 9.31615C13.8358 9.38315 13.5643 9.22041 13.4973 8.95248C12.8713 6.45205 10.6141 4.66675 7.99993 4.66675C5.38454 4.66675 3.12664 6.45359 2.50182 8.95555C2.43491 9.22341 2.16348 9.38635 1.89557 9.31948C1.62766 9.25255 1.46471 8.98115 1.53162 8.71321C2.26701 5.76856 4.9229 3.66675 7.99993 3.66675Z");
    			add_location(path, file$4, 1, 2, 135);
    			attr_dev(svg, "class", "svgShowIcon");
    			set_style(svg, "width", "24px");
    			set_style(svg, "height", "24px");
    			set_style(svg, "position", "relative");
    			set_style(svg, "top", "12px");
    			set_style(svg, "left", "3px");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShowIcon",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/webviews/components/HideIcon.svelte generated by Svelte v3.55.1 */

    const file$3 = "src/webviews/components/HideIcon.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M1.47978 1.4797C1.30227 1.65721 1.28614 1.93498 1.43137 2.13072L1.47978 2.1868L4.1695 4.87652C2.88817 5.77616 1.93052 7.11985 1.53259 8.70952C1.46554 8.97738 1.62834 9.24892 1.89621 9.31598C2.16409 9.38298 2.4356 9.22025 2.50266 8.95232C2.85564 7.54225 3.72742 6.35956 4.88944 5.59626L6.09586 6.80278C5.62419 7.28378 5.33334 7.94278 5.33334 8.66965C5.33334 10.1424 6.52724 11.3363 8 11.3363C8.72694 11.3363 9.38587 11.0454 9.86694 10.5738L13.8131 14.5201C14.0084 14.7154 14.3249 14.7154 14.5202 14.5201C14.6977 14.3426 14.7139 14.0649 14.5686 13.8691L14.5202 13.813L10.4445 9.73692L10.4453 9.73592L9.64527 8.93732L7.732 7.02445L7.73334 7.02392L5.81252 5.10513L5.81334 5.10392L5.05782 4.35024L2.18689 1.4797C1.99163 1.28444 1.67504 1.28444 1.47978 1.4797ZM6.80274 7.51025L9.15947 9.86698C8.85947 10.1575 8.4506 10.3363 8 10.3363C7.07954 10.3363 6.33334 9.59012 6.33334 8.66965C6.33334 8.21905 6.51216 7.81018 6.80274 7.51025ZM8 3.66658C7.33314 3.66658 6.68607 3.7653 6.07406 3.94992L6.89874 4.77404C7.25594 4.70346 7.62427 4.66658 8 4.66658C10.6154 4.66658 12.8733 6.45342 13.4981 8.95538C13.565 9.22325 13.8364 9.38618 14.1043 9.31932C14.3723 9.25238 14.5352 8.98098 14.4683 8.71305C13.7329 5.7684 11.077 3.66658 8 3.66658ZM8.1298 6.0061L10.664 8.53992C10.5961 7.16865 9.49814 6.07168 8.1298 6.0061Z");
    			add_location(path, file$3, 1, 2, 135);
    			attr_dev(svg, "class", "svgHideIcon");
    			set_style(svg, "width", "24px");
    			set_style(svg, "height", "24px");
    			set_style(svg, "position", "relative");
    			set_style(svg, "top", "12px");
    			set_style(svg, "left", "3px");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HideIcon",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/webviews/components/History.svelte generated by Svelte v3.55.1 */

    const file$2 = "src/webviews/components/History.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M13.507 12.324a7 7 0 0 0 .065-8.56A7 7 0 0 0 2 4.393V2H1v3.5l.5.5H5V5H2.811a6.008 6.008 0 1 1-.135 5.77l-.887.462a7 7 0 0 0 11.718 1.092zm-3.361-.97l.708-.707L8 7.792V4H7v4l.146.354 3 3z");
    			add_location(path, file$2, 1, 2, 138);
    			attr_dev(svg, "class", "svgHistoryIcon");
    			set_style(svg, "width", "24px");
    			set_style(svg, "height", "24px");
    			set_style(svg, "position", "relative");
    			set_style(svg, "top", "12px");
    			set_style(svg, "left", "3px");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
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
    	validate_slots('History', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<History> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class History extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "History",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/webviews/components/CollapsibleSection.svelte generated by Svelte v3.55.1 */

    const file$1 = "src/webviews/components/CollapsibleSection.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let h3;
    	let button;
    	let t0;
    	let t1;
    	let svg;
    	let path0;
    	let path1;
    	let t2;
    	let div0;
    	let div0_hidden_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			button = element("button");
    			t0 = text(/*headerText*/ ctx[1]);
    			t1 = space();
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t2 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(path0, "class", "openSection svelte-s6exq2");
    			attr_dev(path0, "stroke", "currentColor");
    			attr_dev(path0, "stroke-width", "1.5");
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "clip-rule", "evenodd");
    			attr_dev(path0, "d", "M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z");
    			add_location(path0, file$1, 10, 8, 322);
    			attr_dev(path1, "class", "closeSection svelte-s6exq2");
    			attr_dev(path1, "stroke", "currentColor");
    			attr_dev(path1, "stroke-width", "1.5");
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "clip-rule", "evenodd");
    			attr_dev(path1, "d", "M8.024 5.928l-4.357 4.357-.62-.618L7.716 5h.618L13 9.667l-.619.618-4.357-4.357z");
    			add_location(path1, file$1, 12, 8, 579);
    			attr_dev(svg, "class", "svgIcon svelte-s6exq2");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "none");
    			add_location(svg, file$1, 8, 6, 207);
    			attr_dev(button, "aria-expanded", /*expanded*/ ctx[0]);
    			attr_dev(button, "class", "svelte-s6exq2");
    			add_location(button, file$1, 7, 4, 116);
    			attr_dev(h3, "class", "svelte-s6exq2");
    			add_location(h3, file$1, 6, 2, 106);
    			attr_dev(div0, "class", "contents");
    			div0.hidden = div0_hidden_value = !/*expanded*/ ctx[0];
    			add_location(div0, file$1, 16, 4, 827);
    			attr_dev(div1, "class", "collapsible svelte-s6exq2");
    			add_location(div1, file$1, 5, 0, 77);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(h3, button);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*headerText*/ 2) set_data_dev(t0, /*headerText*/ ctx[1]);

    			if (!current || dirty & /*expanded*/ 1) {
    				attr_dev(button, "aria-expanded", /*expanded*/ ctx[0]);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*expanded*/ 1 && div0_hidden_value !== (div0_hidden_value = !/*expanded*/ ctx[0])) {
    				prop_dev(div0, "hidden", div0_hidden_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CollapsibleSection', slots, ['default']);
    	let { headerText } = $$props;
    	let { expanded } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (headerText === undefined && !('headerText' in $$props || $$self.$$.bound[$$self.$$.props['headerText']])) {
    			console.warn("<CollapsibleSection> was created without expected prop 'headerText'");
    		}

    		if (expanded === undefined && !('expanded' in $$props || $$self.$$.bound[$$self.$$.props['expanded']])) {
    			console.warn("<CollapsibleSection> was created without expected prop 'expanded'");
    		}
    	});

    	const writable_props = ['headerText', 'expanded'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CollapsibleSection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, expanded = !expanded);

    	$$self.$$set = $$props => {
    		if ('headerText' in $$props) $$invalidate(1, headerText = $$props.headerText);
    		if ('expanded' in $$props) $$invalidate(0, expanded = $$props.expanded);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ headerText, expanded });

    	$$self.$inject_state = $$props => {
    		if ('headerText' in $$props) $$invalidate(1, headerText = $$props.headerText);
    		if ('expanded' in $$props) $$invalidate(0, expanded = $$props.expanded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [expanded, headerText, $$scope, slots, click_handler];
    }

    class CollapsibleSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { headerText: 1, expanded: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CollapsibleSection",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get headerText() {
    		throw new Error("<CollapsibleSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headerText(value) {
    		throw new Error("<CollapsibleSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<CollapsibleSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<CollapsibleSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/webviews/components/Sidebar.svelte generated by Svelte v3.55.1 */
    const file = "src/webviews/components/Sidebar.svelte";

    // (246:4) <CollapsibleSection headerText={'Environment'} expanded={true}>
    function create_default_slot_2(ctx) {
    	let div7;
    	let div1;
    	let div0;
    	let t1;
    	let input0;
    	let t2;
    	let switch_instance0;
    	let t3;
    	let button0;
    	let t4;
    	let div3;
    	let div2;
    	let t6;
    	let input1;
    	let t7;
    	let switch_instance1;
    	let t8;
    	let button1;
    	let t9;
    	let div4;
    	let t11;
    	let input2;
    	let t12;
    	let div6;
    	let div5;
    	let t14;
    	let input3;
    	let input3_type_value;
    	let t15;
    	let switch_instance2;
    	let t16;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = History;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance0 = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	var switch_value_1 = History;

    	function switch_props_1(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value_1) {
    		switch_instance1 = construct_svelte_component_dev(switch_value_1, switch_props_1());
    	}

    	var switch_value_2 = /*componentSelected*/ ctx[0];

    	function switch_props_2(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value_2) {
    		switch_instance2 = construct_svelte_component_dev(switch_value_2, switch_props_2());
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Hostname";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			if (switch_instance0) create_component(switch_instance0.$$.fragment);
    			t3 = space();
    			button0 = element("button");
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "Code Version";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			if (switch_instance1) create_component(switch_instance1.$$.fragment);
    			t8 = space();
    			button1 = element("button");
    			t9 = space();
    			div4 = element("div");
    			div4.textContent = "User Name";
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div5.textContent = "Password";
    			t14 = space();
    			input3 = element("input");
    			t15 = space();
    			if (switch_instance2) create_component(switch_instance2.$$.fragment);
    			t16 = space();
    			button2 = element("button");
    			attr_dev(div0, "class", "textInput svelte-1qllssx");
    			add_location(div0, file, 248, 16, 6738);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "hostname");
    			attr_dev(input0, "class", "svelte-1qllssx");
    			add_location(input0, file, 249, 16, 6793);
    			attr_dev(button0, "id", "btnSvgHostname");
    			attr_dev(button0, "class", "svelte-1qllssx");
    			add_location(button0, file, 255, 16, 7060);
    			add_location(div1, file, 247, 12, 6715);
    			attr_dev(div2, "class", "textInput svelte-1qllssx");
    			add_location(div2, file, 262, 16, 7268);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "codeVersion");
    			attr_dev(input1, "class", "svelte-1qllssx");
    			add_location(input1, file, 263, 16, 7327);
    			attr_dev(button1, "id", "btnSvgCodeversion");
    			attr_dev(button1, "class", "svelte-1qllssx");
    			add_location(button1, file, 269, 16, 7604);
    			add_location(div3, file, 261, 12, 7245);
    			attr_dev(div4, "class", "textInput svelte-1qllssx");
    			add_location(div4, file, 275, 12, 7795);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", "userName");
    			attr_dev(input2, "class", "svelte-1qllssx");
    			add_location(input2, file, 276, 12, 7847);
    			attr_dev(div5, "class", "textInput svelte-1qllssx");
    			add_location(div5, file, 281, 16, 7995);
    			attr_dev(input3, "type", input3_type_value = /*isPasswordVisible*/ ctx[12] ? "text" : "password");
    			attr_dev(input3, "id", "password");
    			attr_dev(input3, "class", "svelte-1qllssx");
    			add_location(input3, file, 282, 16, 8050);
    			attr_dev(button2, "id", "btnSvgPassword");
    			attr_dev(button2, "class", "svelte-1qllssx");
    			add_location(button2, file, 287, 16, 8289);
    			add_location(div6, file, 280, 12, 7972);
    			attr_dev(div7, "id", "environmentBtns");
    			attr_dev(div7, "class", "svelte-1qllssx");
    			add_location(div7, file, 246, 8, 6675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, input0);
    			append_dev(div1, t2);
    			if (switch_instance0) mount_component(switch_instance0, div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(div7, t4);
    			append_dev(div7, div3);
    			append_dev(div3, div2);
    			append_dev(div3, t6);
    			append_dev(div3, input1);
    			append_dev(div3, t7);
    			if (switch_instance1) mount_component(switch_instance1, div3, null);
    			append_dev(div3, t8);
    			append_dev(div3, button1);
    			append_dev(div7, t9);
    			append_dev(div7, div4);
    			append_dev(div7, t11);
    			append_dev(div7, input2);
    			append_dev(div7, t12);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div6, t14);
    			append_dev(div6, input3);
    			append_dev(div6, t15);
    			if (switch_instance2) mount_component(switch_instance2, div6, null);
    			append_dev(div6, t16);
    			append_dev(div6, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[21], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[22], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[23], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[24], false, false, false),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[25], false, false, false),
    					listen_dev(input3, "change", /*change_handler_3*/ ctx[26], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = History)) {
    				if (switch_instance0) {
    					group_outros();
    					const old_component = switch_instance0;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance0 = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance0.$$.fragment);
    					transition_in(switch_instance0.$$.fragment, 1);
    					mount_component(switch_instance0, div1, t3);
    				} else {
    					switch_instance0 = null;
    				}
    			}

    			if (switch_value_1 !== (switch_value_1 = History)) {
    				if (switch_instance1) {
    					group_outros();
    					const old_component = switch_instance1;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value_1) {
    					switch_instance1 = construct_svelte_component_dev(switch_value_1, switch_props_1());
    					create_component(switch_instance1.$$.fragment);
    					transition_in(switch_instance1.$$.fragment, 1);
    					mount_component(switch_instance1, div3, t8);
    				} else {
    					switch_instance1 = null;
    				}
    			}

    			if (!current || dirty[0] & /*isPasswordVisible*/ 4096 && input3_type_value !== (input3_type_value = /*isPasswordVisible*/ ctx[12] ? "text" : "password")) {
    				attr_dev(input3, "type", input3_type_value);
    			}

    			if (switch_value_2 !== (switch_value_2 = /*componentSelected*/ ctx[0])) {
    				if (switch_instance2) {
    					group_outros();
    					const old_component = switch_instance2;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value_2) {
    					switch_instance2 = construct_svelte_component_dev(switch_value_2, switch_props_2());
    					create_component(switch_instance2.$$.fragment);
    					transition_in(switch_instance2.$$.fragment, 1);
    					mount_component(switch_instance2, div6, t16);
    				} else {
    					switch_instance2 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance0) transition_in(switch_instance0.$$.fragment, local);
    			if (switch_instance1) transition_in(switch_instance1.$$.fragment, local);
    			if (switch_instance2) transition_in(switch_instance2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance0) transition_out(switch_instance0.$$.fragment, local);
    			if (switch_instance1) transition_out(switch_instance1.$$.fragment, local);
    			if (switch_instance2) transition_out(switch_instance2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (switch_instance0) destroy_component(switch_instance0);
    			if (switch_instance1) destroy_component(switch_instance1);
    			if (switch_instance2) destroy_component(switch_instance2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(246:4) <CollapsibleSection headerText={'Environment'} expanded={true}>",
    		ctx
    	});

    	return block;
    }

    // (295:4) {#if isProphetInstalled}
    function create_if_block(ctx) {
    	let collapsiblesection0;
    	let t;
    	let collapsiblesection1;
    	let current;

    	collapsiblesection0 = new CollapsibleSection({
    			props: {
    				headerText: 'Compiler',
    				expanded: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	collapsiblesection1 = new CollapsibleSection({
    			props: {
    				headerText: 'Commands',
    				expanded: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(collapsiblesection0.$$.fragment);
    			t = space();
    			create_component(collapsiblesection1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(collapsiblesection0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(collapsiblesection1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const collapsiblesection0_changes = {};

    			if (dirty[0] & /*textCommandPrdBuildBtn, textLayoutPrdBuildBtn, isToShowPrdBuildBtn, textCommandDevBuildBtn, textLayoutDevBuildBtn, isToShowDevBuildBtn*/ 252 | dirty[1] & /*$$scope*/ 4) {
    				collapsiblesection0_changes.$$scope = { dirty, ctx };
    			}

    			collapsiblesection0.$set(collapsiblesection0_changes);
    			const collapsiblesection1_changes = {};

    			if (dirty[1] & /*$$scope*/ 4) {
    				collapsiblesection1_changes.$$scope = { dirty, ctx };
    			}

    			collapsiblesection1.$set(collapsiblesection1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(collapsiblesection0.$$.fragment, local);
    			transition_in(collapsiblesection1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(collapsiblesection0.$$.fragment, local);
    			transition_out(collapsiblesection1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(collapsiblesection0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(collapsiblesection1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(295:4) {#if isProphetInstalled}",
    		ctx
    	});

    	return block;
    }

    // (298:16) {#if isToShowDevBuildBtn}
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
    			attr_dev(button, "class", "btn-build monaco-button monaco-text-button svelte-1qllssx");
    			add_location(button, file, 299, 24, 8717);
    			add_location(div, file, 298, 20, 8686);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[28], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*textLayoutDevBuildBtn*/ 16) set_data_dev(t, /*textLayoutDevBuildBtn*/ ctx[4]);
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
    		source: "(298:16) {#if isToShowDevBuildBtn}",
    		ctx
    	});

    	return block;
    }

    // (306:16) {#if isToShowPrdBuildBtn}
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
    			attr_dev(button, "class", "btn-build monaco-button monaco-text-button svelte-1qllssx");
    			add_location(button, file, 307, 24, 9069);
    			add_location(div, file, 306, 20, 9038);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[29], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*textLayoutPrdBuildBtn*/ 128) set_data_dev(t, /*textLayoutPrdBuildBtn*/ ctx[7]);
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
    		source: "(306:16) {#if isToShowPrdBuildBtn}",
    		ctx
    	});

    	return block;
    }

    // (296:8) <CollapsibleSection headerText={'Compiler'} expanded={true}>
    function create_default_slot_1(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*isToShowDevBuildBtn*/ ctx[2] && create_if_block_2(ctx);
    	let if_block1 = /*isToShowPrdBuildBtn*/ ctx[5] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "id", "commandsBtn");
    			attr_dev(div, "class", "svelte-1qllssx");
    			add_location(div, file, 296, 12, 8599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*isToShowDevBuildBtn*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
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
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(296:8) <CollapsibleSection headerText={'Compiler'} expanded={true}>",
    		ctx
    	});

    	return block;
    }

    // (316:8) <CollapsibleSection headerText={'Commands'} expanded={true}>
    function create_default_slot(ctx) {
    	let div3;
    	let div0;
    	let button0;
    	let t1;
    	let div1;
    	let button1;
    	let t3;
    	let div2;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Clean Project / Upload All";
    			t1 = space();
    			div1 = element("div");
    			button1 = element("button");
    			button1.textContent = "Enable Upload";
    			t3 = space();
    			div2 = element("div");
    			button2 = element("button");
    			button2.textContent = "Disable Upload";
    			attr_dev(button0, "class", "btn-prophet monaco-button monaco-text-button svelte-1qllssx");
    			add_location(button0, file, 318, 20, 9538);
    			add_location(div0, file, 317, 16, 9511);
    			attr_dev(button1, "class", "btn-prophet monaco-button monaco-text-button svelte-1qllssx");
    			add_location(button1, file, 324, 20, 9817);
    			add_location(div1, file, 323, 16, 9790);
    			attr_dev(button2, "class", "btn-prophet monaco-button monaco-text-button svelte-1qllssx");
    			add_location(button2, file, 330, 20, 10064);
    			add_location(div2, file, 329, 16, 10037);
    			attr_dev(div3, "id", "prophetBtn");
    			attr_dev(div3, "class", "svelte-1qllssx");
    			add_location(div3, file, 316, 12, 9472);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, button1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_5*/ ctx[30], false, false, false),
    					listen_dev(button1, "click", /*click_handler_6*/ ctx[31], false, false, false),
    					listen_dev(button2, "click", /*click_handler_7*/ ctx[32], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(316:8) <CollapsibleSection headerText={'Commands'} expanded={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let collapsiblesection;
    	let t;
    	let current;

    	collapsiblesection = new CollapsibleSection({
    			props: {
    				headerText: 'Environment',
    				expanded: true,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*isProphetInstalled*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(collapsiblesection.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "id", "main");
    			attr_dev(div, "class", "svelte-1qllssx");
    			add_location(div, file, 243, 0, 6579);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(collapsiblesection, div, null);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const collapsiblesection_changes = {};

    			if (dirty[0] & /*componentSelected, isPasswordVisible, codeversionConstant, codeversionPropertyShort, hostnameConstant, hostnamePropertyShort*/ 7937 | dirty[1] & /*$$scope*/ 4) {
    				collapsiblesection_changes.$$scope = { dirty, ctx };
    			}

    			collapsiblesection.$set(collapsiblesection_changes);

    			if (/*isProphetInstalled*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*isProphetInstalled*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(collapsiblesection.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(collapsiblesection.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(collapsiblesection);
    			if (if_block) if_block.d();
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
    	let codeversionPropertyShort;
    	let hostnamePropertyShort;

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
    		$$invalidate(8, codeversionConstant = codeversion);
    		$$invalidate(9, hostnameConstant = hostname);
    		$$invalidate(10, codeversionPropertyShort = codeversionHistoryPropertyShort);
    		$$invalidate(11, hostnamePropertyShort = hostnameHistoryPropertyShort);
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

    	const changeProperty = (input, property) => {
    		tsvscode.postMessage({
    			type: 'onChangeProperty',
    			value: [input, property]
    		});
    	};

    	const clickBtnHistory = property => {
    		tsvscode.postMessage({ type: 'onShowQuickPick', value: property });
    	};

    	function buttonClick() {
    		$$invalidate(12, isPasswordVisible = !isPasswordVisible);
    		$$invalidate(0, componentSelected = isPasswordVisible ? HideIcon : ShowIcon);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => {
    		changeProperty(e.target.value, hostnamePropertyShort);
    		changeJsonFile();
    	};

    	const click_handler = () => {
    		clickBtnHistory(hostnameConstant);
    	};

    	const change_handler_1 = e => {
    		changeProperty(e.target.value, codeversionPropertyShort);
    		changeJsonFile();
    	};

    	const click_handler_1 = () => {
    		clickBtnHistory(codeversionConstant);
    	};

    	const change_handler_2 = () => {
    		changeJsonFile();
    	};

    	const change_handler_3 = () => {
    		changeJsonFile();
    	};

    	const click_handler_2 = () => {
    		buttonClick();
    	};

    	const click_handler_3 = () => {
    		clickBtnBuild(textCommandDevBuildBtn);
    	};

    	const click_handler_4 = () => {
    		clickBtnBuild(textCommandPrdBuildBtn);
    	};

    	const click_handler_5 = () => {
    		clickBtnCleanUpload();
    	};

    	const click_handler_6 = () => {
    		clickBtnEnableUpload();
    	};

    	const click_handler_7 = () => {
    		clickBtnDisableUpload();
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		ShowIcon,
    		HideIcon,
    		History,
    		CollapsibleSection,
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
    		codeversionPropertyShort,
    		hostnamePropertyShort,
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
    		if ('codeversionConstant' in $$props) $$invalidate(8, codeversionConstant = $$props.codeversionConstant);
    		if ('hostnameConstant' in $$props) $$invalidate(9, hostnameConstant = $$props.hostnameConstant);
    		if ('codeversionPropertyShort' in $$props) $$invalidate(10, codeversionPropertyShort = $$props.codeversionPropertyShort);
    		if ('hostnamePropertyShort' in $$props) $$invalidate(11, hostnamePropertyShort = $$props.hostnamePropertyShort);
    		if ('isPasswordVisible' in $$props) $$invalidate(12, isPasswordVisible = $$props.isPasswordVisible);
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
    		codeversionConstant,
    		hostnameConstant,
    		codeversionPropertyShort,
    		hostnamePropertyShort,
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
    		click_handler,
    		change_handler_1,
    		click_handler_1,
    		change_handler_2,
    		change_handler_3,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

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
