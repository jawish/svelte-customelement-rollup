function noop() { }
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

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
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
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}

let current_component;
function set_current_component(component) {
    current_component = component;
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
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        dirty_components.length = 0;
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
    flushing = false;
    seen_callbacks.clear();
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
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
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
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if ($$.bound[i])
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
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
let SvelteElement;
if (typeof HTMLElement === 'function') {
    SvelteElement = class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }
        connectedCallback() {
            // @ts-ignore todo: improve typings
            for (const key in this.$$.slotted) {
                // @ts-ignore todo: improve typings
                this.appendChild(this.$$.slotted[key]);
            }
        }
        attributeChangedCallback(attr, _oldValue, newValue) {
            this[attr] = newValue;
        }
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            // TODO should this delegate to addEventListener?
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    };
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

/* src/NestedComponent.svelte generated by Svelte v3.22.2 */

function create_fragment(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			if (img.src !== (img_src_value = `https://api.adorable.io/avatars/face/eyes4/nose3/mouth7/${/*avatarColor*/ ctx[0]}`)) attr(img, "src", img_src_value);
			attr(img, "alt", "Avatar");
			attr(img, "width", "150");
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, [dirty]) {
			if (dirty & /*avatarColor*/ 1 && img.src !== (img_src_value = `https://api.adorable.io/avatars/face/eyes4/nose3/mouth7/${/*avatarColor*/ ctx[0]}`)) {
				attr(img, "src", img_src_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { color = "#ffcc00" } = $$props;

	$$self.$set = $$props => {
		if ("color" in $$props) $$invalidate(1, color = $$props.color);
	};

	let avatarColor;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*color*/ 2) {
			 $$invalidate(0, avatarColor = color.substring(1));
		}
	};

	return [avatarColor, color];
}

class NestedComponent extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { color: 1 });
	}
}

/* src/OtherComponent.svelte generated by Svelte v3.22.2 */

function create_fragment$1(ctx) {
	let div;
	let h3;
	let t0;
	let t1;
	let t2;
	let t3;
	let current;
	const nestedcomponent = new NestedComponent({ props: { color: /*color*/ ctx[1] } });

	return {
		c() {
			div = element("div");
			h3 = element("h3");
			t0 = text("Hello, ");
			t1 = text(/*name*/ ctx[0]);
			t2 = text("!");
			t3 = space();
			create_component(nestedcomponent.$$.fragment);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, h3);
			append(h3, t0);
			append(h3, t1);
			append(h3, t2);
			append(div, t3);
			mount_component(nestedcomponent, div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*name*/ 1) set_data(t1, /*name*/ ctx[0]);
			const nestedcomponent_changes = {};
			if (dirty & /*color*/ 2) nestedcomponent_changes.color = /*color*/ ctx[1];
			nestedcomponent.$set(nestedcomponent_changes);
		},
		i(local) {
			if (current) return;
			transition_in(nestedcomponent.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(nestedcomponent.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(nestedcomponent);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { name = "Mark" } = $$props;
	let { color = "#ffcc00" } = $$props;

	$$self.$set = $$props => {
		if ("name" in $$props) $$invalidate(0, name = $$props.name);
		if ("color" in $$props) $$invalidate(1, color = $$props.color);
	};

	return [name, color];
}

class OtherComponent extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0, color: 1 });
	}
}

/* src/Component.wc.svelte generated by Svelte v3.22.2 */

function create_fragment$2(ctx) {
	let current;
	const othercomponent = new OtherComponent({ props: { name: "John" } });

	return {
		c() {
			create_component(othercomponent.$$.fragment);
			this.c = noop;
		},
		m(target, anchor) {
			mount_component(othercomponent, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(othercomponent.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(othercomponent.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(othercomponent, detaching);
		}
	};
}

class Component_wc extends SvelteElement {
	constructor(options) {
		super();
		init(this, { target: this.shadowRoot }, null, create_fragment$2, safe_not_equal, {});

		if (options) {
			if (options.target) {
				insert(options.target, this, options.anchor);
			}
		}
	}
}

customElements.define("my-component", Component_wc);

export { Component_wc as Component, NestedComponent, OtherComponent };
