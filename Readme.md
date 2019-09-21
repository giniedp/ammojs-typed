# Ammo.js Typed

This project generates a `.d.ts` file based on a WebIDL input file specificly for the [Ammo.js](https://github.com/kripken/ammo.js) project.

The goal is to be able to generate typescript definitions from the latest version of ammo.js
or for a customized ammo.idl file when generating custom ammo.js builds

# Usage

You can use this repo as an NPM package if you are interested in the latest ammojs build with type definitions

```
$ npm install github:giniedp/ammojs-typed
```

## Use Ammo as window global

Configure your `tsconfig.json` to lookup the types

```json
  "typeRoots": ["node_modules/ammojs-typed/ammo/ambient"]
```

Then at some point require ammo.js (depends on your build chain)

```ts
require('ammojs-typed')
```

And use the global `Ammo` object

```ts
Ammo().then(() => {
  new Ammo.btVector3(1, 2, 3)
})
```

## Use Ammo as es6 module

This works but be cautious here. The import gives you the bootstrap function. After bootstrapping
the api is not available through the `Ammo` symbol by default.

```ts
import Ammo from 'ammojs-typed'

Ammo().then(api => {
  const v1 = new api.btVector3(1, 2, 3)
  const v2 = new Ammo.btVector3(1, 2, 3) // <-- error here
})
```

You can work around that by booting like this

```ts
import Ammo from 'ammojs-typed'

Ammo(Ammo).then(() => {
  const v2 = new Ammo.btVector3(1, 2, 3) // <-- works
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
npm run download
```

Make your adjustments to the IDL file if needed (see below) and run

```
npm run generate
```

This will parse the `./ammo/ammo.idl` and generate a `./ammo/ammo.d.ts` as well as `./ammo/ambient/ammo.d.ts`

Verify that the generated files have no issues

```
npm run lint
```

# Automatic IDL adjustments

The current `ammo.idl` is not compatible with the webidl2 parser out of the box. The following adjustments
are made automatically when the idl file is parsed

1. Inheritance statements like these

```idl
interface btVector4 {

};
btVector4 implements btVector3;
```

are transformed to

```idl
interface btVector4: btVector3 {

};

```

2. Array types like `float[]` are replaced with a sequence type

- `float[]` -> `sequence<float>`
- `long[]` -> `sequence<long>`

3. sequence types are not allowed for attribute fields. The following lines are currently ignored

- `attribute float[] m_plane;`

# Manual IDL adjustments

The `btVector4` implements the shape of `btVector3` which causes a signature mismatch of the `setValue` method which typescript complains about. Add the following to the `btVector4`

```
void setValue(float x, float y, float z);
```

The `btDbvtBroadphase` should derive from `btBroadphaseInterface`

```
interface btDbvtBroadphase: btBroadphaseInterface {
```

# Generated but not inferred from the IDL

Its basically the following wrapper

```.ts
declare function Ammo<T>(api?: T): Promise<T & typeof Ammo>;
declare module Ammo {
  function destroy(obj: any): void;

  // ... generated from IDL
}
```

# References

- https://github.com/kripken/ammo.js/issues/233
- https://github.com/microsoft/TSJS-lib-generator
- https://github.com/osman-turan/ammo.js-typings
- https://ts-ast-viewer.com
