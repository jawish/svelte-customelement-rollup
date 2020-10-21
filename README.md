# Svelte Custom Element vs Svelte Component

This demo demostrates how to use Rollup's config to allow building and exposing some Svelte components with svelte-options tag set and customElements=true while allowing other components to be built and used as Svelte components.

This is achieved by using the special file extension '.wc.svelte' for components to be built as Custom Elements and the usual '.svelte' extension for Svelte components. Then have two plugin blocks in the Rollup config to build the two types separately.

```js
svelte({ customElement: true, include: /\.wc\.svelte$/ }),
svelte({ customElement: false, exclude: /\.wc\.svelte$/ }),
```

In the custom element below, only the my-component is exposed as the web component in the build while OtherComponent and NestedComponent as built as normal Javascript Svelte components.

See the built demo: [https://jawish.github.io/svelte-customelement-rollup](https://jawish.github.io/svelte-customelement-rollup).

## Scoped CSS support
Svelte bundles the styles defined inside components into `bundle.css`. If you add `<link rel='stylesheet' href='./bundle.css'>` to `head` for example, they wont apply to the custom element components because their dom tree is inside a [shadow dom](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM).
So you need to include the bundled css file inside the custom element:
```html
<!-- Component.wc.svelte -->
<link rel='stylesheet' href='./bundle.css'>
```

And get custom scoped css just like any other Svelte component!