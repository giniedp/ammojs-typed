

import Ammo from 'ammojs-typed'
import { loop } from '@gglib/utils'
import { Scene } from './scene'

function run() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const button = document.querySelector('button')
  button.addEventListener('click', () => {
    scene.reset()
  })

  const scene = new Scene(canvas)
  loop((dt: number) => {
    scene.update(dt)
    scene.draw()
  })
}

// We have to initialize ammo like this
// so that the Ammo function becomes the Ammo api
// object. This must run before any Ammo related
// code is executed.
Ammo(Ammo).then(run)

// We could load Ammo like this
//   Ammo().then((ammo) => {
//
//   })
// and then use the `ammo` variable as the ammo api.
// However we would have to pass that `ammo` object
// to other parts of the code manually (like the simulation.ts)
