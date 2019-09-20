# Ammo.js Typed

This project generates a `.d.ts` file based on a WebIDL input file specificly for the [Ammo.js](https://github.com/kripken/ammo.js) project.

The goal is to be able to generate typescript definitions from the latest version of ammo.js
or for a customized ammo.idl file when generating custom ammo.js builds

# Usage

You can use this repo as an NPM package if you are interested in the lates ammojs build with type definitions

```
$ npm install github:giniedp/ammojs-typed
```

Then in your typescript

```ts
import Ammo from 'ammojs-typed'

Ammo().then(() => {
  // Bullet-interfacing code
})
```

# Generate

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

This will parse the `./ammo/ammo.idl` and generate a `./ammo/ammo.d.ts`

Verify that the generated file has no issues

```
npm run lint
```

Verify that the generated file matches the downloaded `ammo.js` build

**this step is not implemented yet**

```
npm run test
```

# Automatic IDL adjustments

The current `ammo.idl` is not compatible with the webidl2 parser out of the box. The following adjustments
are made automatically when the idl file is parsed

1. Inheritance
   Inheritance statements like these

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
export default Ammo;
export declate function Ammo(): Promise<void>
export declare module Ammo {
  function destroy(value: any): void;

  // ... generated from IDL
}
```

# References

- https://github.com/kripken/ammo.js/issues/233
- https://github.com/microsoft/TSJS-lib-generator
- https://github.com/osman-turan/ammo.js-typings
