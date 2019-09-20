import { convertIDL, parseIDL } from './lib'
import * as fs from 'fs'

fs.writeFileSync('./ammo/ammo.d.ts', convertIDL(parseIDL('./ammo/ammo.idl')))
