import * as fs from 'fs'
import { printAmmoAmbient, printAmmoModule, convertIDL, parseIDL } from './lib'

const ammoIDL = parseIDL('./ammo/ammo.idl');
const ammoTS = convertIDL(ammoIDL)

if (!fs.existsSync('./ammo/ambient')) {
  fs.mkdirSync('./ammo/ambient')
}
fs.writeFileSync('./ammo/ambient/ammo.d.ts', printAmmoAmbient(ammoTS));
fs.writeFileSync('./ammo/ammo.d.ts', printAmmoModule(ammoTS));
