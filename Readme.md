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

## Ammo as ES module import

Set this in `tsconfig.json`:

```json
"esModuleInterop": true
```

Import ammo:

```ts
import Ammo from "ammojs-typed";
```

The default import is the init function. Call it before you use the API.

**Option 1:** use the returned instance.

```ts
const api = await Ammo();
const v = new api.btVector3(1, 2, 3);
```

**Option 2:** pass `Ammo` to init, which attaches the API to `Ammo` itself.

```ts
await Ammo(Ammo);
const v = new Ammo.btVector3(1, 2, 3);
```

⚠️ `await Ammo()` does **not** attach the API to `Ammo`. The types can't catch this.

```ts
await Ammo(); // no initialize target
new Ammo.btVector3(1, 2, 3); // runtime error
```

### Dynamic import

```ts
const { default: Ammo } = await import("ammojs-typed");
await Ammo(Ammo);
```

### WebAssembly build

```ts
import Ammo from "ammojs-typed/wasm";
```

## Bundlers (Rollup, Vite)

`ammo.js` is a CommonJS module. Rollup needs `@rollup/plugin-commonjs` to import it. Vite includes it by default.

```js
// rollup.config.js
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  // ...
  plugins: [nodeResolve(), commonjs()],
};
```

Bundled ES modules run in strict mode. There, a plain `Ammo()` call fails with:

```
TypeError: Cannot set properties of undefined (setting 'Ammo')
```

Call init with an explicit `this`:

```ts
const api = await Ammo.call({});
// or attach the API to Ammo itself
await Ammo.call({}, Ammo);
```

## Ammo as global (script tag)

Use this when ammo is loaded with a `<script>` tag and not imported.

```html
<script src="ammo.js"></script>
```

Add the global types in `tsconfig.json`:

```json
"types": ["ammojs-typed/ambient"]
```

or at the top of one `.ts` file:

```ts
/// <reference types="ammojs-typed/ambient" />
```

`Ammo` is now available globally, with no import. Init works the same as with the ES module:

```ts
await Ammo(Ammo);
const v = new Ammo.btVector3(1, 2, 3);
```

or

```ts
const api = await Ammo();
const v = new api.btVector3(1, 2, 3);
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
