# SvelteKit

Awesome **SvelteKit** Links

## Components

- Force Graph examples with D3

  - <https://svelte.dev/repl/c23b43904005457981e78ca5042f7dd4?version=3.29.7>
  - <https://github.com/happybeing/d3-fdg-svelte>
  - <https://github.com/jlefebure/redisgraph-navi/tree/master/src/client>
  - [Autosize Textarea](https://github.com/ankurrsinghal/svelte-autoresize-textarea)

- three.js

  - [Threlte](https://threlte.xyz/) is a component library for Svelte to build and render `three.js` scenes declaratively and state-driven in Svelte apps.

- Grid

  - [svelte-image-gallery](https://github.com/berkinakkaya/svelte-image-gallery)

- Charts

  - [pancake](https://pancake-charts.surge.sh/)
  - [Layer Cake](https://layercake.graphics/) supports SSR, responsive graphics, full customizable layers for your graph.

## Animation

- [Svelte Star Wars Demo](https://github.com/geoffrich/star-wars-demo-svelte)

## State Management

- [svelte-store-array](https://github.com/accuser/svelte-store-array) A collection of higher-order store functions for
  array-based stores.

## Utilities

- [Time Distance](https://github.com/joshnuss/svelte-time-distance) - Display time distances in a human-readable format.
- [svelte-action-balancer](https://svelte-action-balancer.netlify.app/) - A Simple Svelte Action That Makes Titles More Readable
- [svelte-put](https://github.com/vnphanquang/svelte-put) - A set of useful svelte **transitions**, **actions** and **components** to put in your projects
- [svelte-body](https://github.com/ghostdevv/svelte-body) - Currently in SvelteKit, applying styles per page to the body doesn't work. `svelte-body` handles that for you!
- [svelte-legos](https://github.com/ankurrsinghal/svelte-legos)[DEMO](https://svelte-legos.singhalankur.com)
- [React Hooks in Svelte](<[auth.md](https://github.com/breadthe/react-hooks-in-svelte)>)

## GraphQL

- GraphQL Client - [houdini](https://houdinigraphql.com/)
  - Grafbase [live query plugin](https://github.com/grafbase/grafbase/tree/main/examples/sveltekit-houdini), [Getting started](https://grafbase.com/guides/getting-started-with-sveltekit-houdini-and-grafbase)
- [GraphQL Mesh](https://the-guild.dev/graphql/mesh) Gateway
  - [kit-mesh](https://github.com/jycouet/kit-mesh/blob/main/src/routes/api/%2Bserver.ts), [yoga-sveltekit](https://github.com/jycouet/graphql-yoga-sveltekit/blob/master/src/routes/api/graphql.ts)

## Testing

- [Svelte Component Test Recipes](https://github.com/davipon/svelte-component-test-recipes)
  - Svelte component test recipes using Vitest & Testing Library with TypeScript
- [Test Svelte Component Using Vitest & Playwright](https://davipon.hashnode.dev/test-svelte-component-using-vitest-playwright)

## Project Templates

- [Svelte Sirens](https://github.com/Svelte-Sirens/svelte-sirens)
- [Usagizmo turbo Monorepo](https://github.com/usagizmo/webapp-template)
- [SvelteKit stack for enterprise](https://github.com/joysofcode/enterprise-stack)

## Deployment

- [SvelteKit on the edge](https://github.com/Rich-Harris/sveltekit-on-the-edge)
  - A demo [SvelteKit](https://kit.svelte.dev/) app running on [Vercel Edge Functions](https://vercel.com/features/edge-functions), which run close to your users to enable dynamic server-side rendering at the speed of static content.

## Performance

## APIs

- Database access with [PrismaClient](https://github.com/joshnuss/sky-cart/blob/main/src/lib/services/db.js) example

## Tools

- [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
  - A [Prettier](https://prettier.io/) plugin for Tailwind CSS v3.0+ that automatically sorts classes based
    on [our recommended class order](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier#how-classes-are-sorted)

## Samples

- [Zod Validation](https://twitter.com/BHolmesDev/status/1581627163098632194?s=20&t=O-vh5nFKUjCOyTTBnaRwQA)

## FQA

- External Links

tell SvelteKit not to handle a link, but allow the browser to handle it

```html
<a rel="external" href="path">Path</a>
```

By default, the **SvelteKit** runtime intercepts clicks on `<a>` elements and bypasses the normal browser navigation
for relative (same-origin) URLs that match one of your page routes.  
 SvelteKit doc Adding a `rel=external` attribute to a link will trigger a browser navigation when the link is clicked.

- Felte - ignore a specific form firled

add `data-felte-ignore` attrubute

- How to fix `Cross-site POST form submissions are forbidden` aks CSRF

Add ORIGIN Env Varaible i.e., `ORIGIN=http://localhost:3000 node build/index.js`

- How to make SvelteKit WebApp as PWA
  - **Option 1:** add `src/service-worker.js` as documented in SvelteKit [Docs](https://kit.svelte.dev/docs/service-workers)
  - **Option 2:** If you need a more full-flegded but also more opinionated solution, we recommend looking at solutions like [Vite PWA plugin](https://vite-pwa-org.netlify.app/frameworks/sveltekit.html), which uses [Workbox](https://web.dev/learn/pwa/workbox).

## Community

- [svelteradio](https://www.svelteradio.com/)
- [sveltesociety](https://sveltesociety.dev/)

## Reference

- <https://github.com/rocketlaunchr/awesome-svelte>
- Huntabyte [YouTube](https://www.youtube.com/c/Huntabyte>) tutorials
- <https://github.com/janosh/awesome-sveltekit>
- Learn something new with GraphQL, every week - [graphql.wtf](https://graphql.wtf/)
