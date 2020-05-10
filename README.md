# Svelte Custom Element vs Svelte Component

This demo demostrates how to use Rollup's config to allow building and exposing some Svelte components with svelte-options tag set and customElements=true while allowing other components to be built and used as Svelte components.

This is achieved by using the special file extension '.wc.svelte' for components to be built as Custom Elements and the usual '.svelte' extension for Svelte components. Then have two plugin blocks in the Rollup config to build the two types separately.

```
svelte({ customElement: true, include: /\.wc\.svelte$/ }),
svelte({ customElement: false, exclude: /\.wc\.svelte$/ }),
```

In the custom element below, only the my-component is exposed as the web component in the build while OtherComponent and NestedComponent as built as normal Javascript Svelte components.

See the built demo: [https://jawish.github.io/jawish/svelte-customelement-rollup](https://jawish.github.io/jawish/svelte-customelement-rollup).
