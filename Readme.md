# Ammo.js Typed

This project provides the [Ammo.js](https://github.com/kripken/ammo.js) modules with typescript definitions.

# Installation

Use npm or yarn to install this version of ammojs from npm

```
$ npm install ammojs-typed
```

or from github

```
$ npm install github:giniedp/ammojs-typed
```

# Usage
## Ammo as window global

Configure your `tsconfig.json` to lookup the ambient types

```json
  "typeRoots": ["node_modules/ammojs-typed/ammo/ambient"]
```

Then at some point require ammo.js (depends on your build chain)

```ts
require('ammojs-typed')
```

or reference the script

```html
<script src="./ammo.js">
```

And use the global `Ammo` object

```ts
Ammo().then(() => {
  new Ammo.btVector3(1, 2, 3)
})
```

## Ammo as es6 module import

You probably need to set the following `compilerOptions` in `tsconfig.json`

```json
  "allowSyntheticDefaultImports": true,
  "esModuleInterop": true
```

Then import ammo like this

```ts
import Ammo from 'ammojs-typed'
```

This works but be cautious here. The default import gives you the bootstrap function.
After bootstrapping the api is not available through the `Ammo` symbol by default.

```ts
Ammo().then(api => {
  const v1 = new api.btVector3(1, 2, 3)
  const v2 = new Ammo.btVector3(1, 2, 3) // <-- runtime error here
})
```

You can work around that by booting like this

```ts
Ammo(Ammo).then(() => {
  const v2 = new Ammo.btVector3(1, 2, 3) // <-- works
})
```

## Ammo as dynamic import

Enable same `compilerOptions` as above

```ts
import('./ammo.js')                        // use dynamic import
  .then((Module) => Module.default())      // bootstrap ammo.js
  .then((ammo) => {
    const v1 = new ammo.btVector3(1, 2, 3) // use ammo here
  })
```

Since typescript 3.8 you can use [type only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-exports). So with dynamic imports you can safely import ammo.js types, without including them in you bundle like this

```ts
import type Ammo from './ammo.js'

import('./ammo.js')                        // use dynamic import
  .then((Module) => Module.default())      // bootstrap ammo.js
  .then((ammo) => {
    let v1: Ammo.btVector3 = null
    // ...
    v1 = v
  })
```

# Generate .d.ts files

Clone this repository and install node dependencies

```
git clone git@github.com:giniedp/ammojs-typed.git
cd ammojs-typed
npm install
```

Place the `ammo.idl` and `ammo.js` into the `./ammo` folder.
To download the latest version from the ammo.js repository run

```
$ npm run download
```

Make your adjustments to the IDL file if needed (see below) and run

```
$ npm run generate
```

This will parse the `./ammo/ammo.idl` and generate a `./ammo/ammo.d.ts` as well as `./ammo/ambient/ammo.d.ts`

# Manual IDL adjustments

The `btVector4` implements the shape of `btVector3` which causes a signature mismatch of the `setValue` method which typescript complains about. Add the following to the `btVector4`

```diff
+void setValue(float x, float y, float z);
```

The `btDbvtBroadphase` should derive from `btBroadphaseInterface`

```diff
-interface btDbvtBroadphase {
+interface btDbvtBroadphase: btBroadphaseInterface {
```

# References

- https://github.com/kripken/ammo.js/issues/233
- https://github.com/microsoft/TSJS-lib-generator
- https://github.com/osman-turan/ammo.js-typings
- https://ts-ast-viewer.com
