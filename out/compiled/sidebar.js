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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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

    /* src\webviews\components\Sidebar.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;
    const file = "src\\webviews\\components\\Sidebar.svelte";

    function create_fragment(ctx) {
    	let div4;
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
    	let div3;
    	let t10;
    	let input3;
    	let input3_type_value;
    	let t11;
    	let button;
    	let t12_value = (/*isPasswordVisible*/ ctx[0] ? "Hide" : "Show") + "";
    	let t12;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
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
    			div3 = element("div");
    			div3.textContent = "Password";
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			button = element("button");
    			t12 = text(t12_value);
    			attr_dev(div0, "class", "svelte-1cu8nmu");
    			add_location(div0, file, 145, 4, 4128);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "hostname");
    			attr_dev(input0, "class", "svelte-1cu8nmu");
    			add_location(input0, file, 146, 4, 4153);
    			attr_dev(div1, "class", "svelte-1cu8nmu");
    			add_location(div1, file, 150, 4, 4246);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "codeVersion");
    			attr_dev(input1, "class", "svelte-1cu8nmu");
    			add_location(input1, file, 151, 4, 4275);
    			attr_dev(div2, "class", "svelte-1cu8nmu");
    			add_location(div2, file, 155, 4, 4371);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", "userName");
    			attr_dev(input2, "class", "svelte-1cu8nmu");
    			add_location(input2, file, 156, 4, 4397);
    			attr_dev(div3, "class", "svelte-1cu8nmu");
    			add_location(div3, file, 160, 4, 4490);
    			attr_dev(input3, "type", input3_type_value = /*isPasswordVisible*/ ctx[0] ? "text" : "password");
    			attr_dev(input3, "id", "password");
    			attr_dev(input3, "class", "svelte-1cu8nmu");
    			add_location(input3, file, 161, 4, 4515);
    			attr_dev(button, "id", "btnSeePassword");
    			attr_dev(button, "class", "monaco-button monaco-text-button svelte-1cu8nmu");
    			add_location(button, file, 165, 4, 4643);
    			attr_dev(div4, "id", "main");
    			attr_dev(div4, "class", "svelte-1cu8nmu");
    			add_location(div4, file, 143, 0, 4105);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t1);
    			append_dev(div4, input0);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div4, t4);
    			append_dev(div4, input1);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div4, t7);
    			append_dev(div4, input2);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div4, t10);
    			append_dev(div4, input3);
    			append_dev(div4, t11);
    			append_dev(div4, button);
    			append_dev(button, t12);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[3], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[4], false, false, false),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[5], false, false, false),
    					listen_dev(input3, "change", /*change_handler_3*/ ctx[6], false, false, false),
    					listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isPasswordVisible*/ 1 && input3_type_value !== (input3_type_value = /*isPasswordVisible*/ ctx[0] ? "text" : "password")) {
    				attr_dev(input3, "type", input3_type_value);
    			}

    			if (dirty & /*isPasswordVisible*/ 1 && t12_value !== (t12_value = (/*isPasswordVisible*/ ctx[0] ? "Hide" : "Show") + "")) set_data_dev(t12, t12_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
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

    async function preload() {
    	const response = await this.fetch('videoslist.json');
    	const responseJson = await response.json();
    	return { videos: responseJson };
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);

    	onMount(() => {
    		tsvscode.postMessage({ type: 'init-view', value: true });
    	});

    	let hostnameInput = document.getElementById('hostname');

    	hostnameInput.innerText = json === null || json === void 0
    	? void 0
    	: json.hostname;

    	// To change the visibility of password field
    	let isPasswordVisible = false;

    	const changeJsonFile = () => {
    		var _a, _b, _c, _d;

    		//@ts-ignore
    		const hostname = (_a = document.getElementById('hostname')) === null || _a === void 0
    		? void 0
    		: _a.value;

    		//@ts-ignore
    		const username = (_b = document.getElementById('userName')) === null || _b === void 0
    		? void 0
    		: _b.value;

    		//@ts-ignore
    		const password = (_c = document.getElementById('password')) === null || _c === void 0
    		? void 0
    		: _c.value;

    		//@ts-ignore
    		const codeversion = (_d = document.getElementById('codeVersion')) === null || _d === void 0
    		? void 0
    		: _d.value;

    		const jsonContent = {
    			hostname,
    			username,
    			password,
    			"code-version": codeversion
    		};

    		console.log(jsonContent);
    		tsvscode.postMessage({ type: 'onChangeFile', value: jsonContent });
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const change_handler = () => {
    		changeJsonFile();
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
    		$$invalidate(0, isPasswordVisible = !isPasswordVisible);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		preload,
    		hostnameInput,
    		isPasswordVisible,
    		changeJsonFile
    	});

    	$$self.$inject_state = $$props => {
    		if ('hostnameInput' in $$props) hostnameInput = $$props.hostnameInput;
    		if ('isPasswordVisible' in $$props) $$invalidate(0, isPasswordVisible = $$props.isPasswordVisible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isPasswordVisible,
    		changeJsonFile,
    		preload,
    		change_handler,
    		change_handler_1,
    		change_handler_2,
    		change_handler_3,
    		click_handler
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { preload: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get preload() {
    		return preload;
    	}

    	set preload(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
