

import Ammo from 'ammojs-typed'
import { loop } from '@gglib/utils'
import { Scene } from './scene'

function run() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const scene = new Scene(canvas)
  loop((dt: number) => {
    scene.update(dt)
    scene.draw()
  })
}

Ammo(Ammo).then(run)
