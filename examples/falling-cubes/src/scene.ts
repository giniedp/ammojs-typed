import Ammo from 'ammojs-typed'
import { loop } from '@gglib/utils'
import { Mat4, Vec3 } from '@gglib/math'
import { Device, ModelMesh, ModelBuilder, ShaderEffect, ShaderProgram, buildCube } from '@gglib/graphics'

import { Simulation } from './simulation'
import { createShader } from './shader'

export class Scene {

  private numCubes = 100
  private device: Device
  private mesh: ModelMesh
  private program: ShaderProgram
  private effects: ShaderEffect[] = []
  private view = Mat4.createIdentity()
  private projection = Mat4.createIdentity()
  private viewPosition = Vec3.create(0, 0, 25)
  private simulation = new Simulation(this.numCubes)

  public constructor(canvas: HTMLCanvasElement) {
    this.device = new Device({ canvas: canvas })
    this.program = createShader(this.device)
    this.mesh = ModelBuilder.begin().tap(b => buildCube(b, { size: 2 })).endMesh(this.device)

    for (let i = 0; i < this.numCubes; i++) {
      this.effects[i] = this.device.createEffect({
        program: this.program,
        parameters: {
          world: Mat4.createIdentity(),
          eyePosition: this.viewPosition,
          view: this.view,
          projection: this.projection,
          specularPower: Math.random() + 0.1,
          diffuseColor: [Math.random(), Math.random(), Math.random()],
          lightColor: [Math.random(), Math.random(), Math.random()],
        },
      })
    }
  }

  public update(dt: number) {
    this.simulation.simulate(dt)
  }

  public draw() {
    this.device.clear()
    this.device.resize()
    this.view.initTranslation(this.viewPosition.x, this.viewPosition.y, this.viewPosition.z).invert()
    this.projection.initPerspectiveFieldOfView(Math.PI / 3, this.device.drawingBufferAspectRatio, 0.1, 100)
    this.effects.forEach(this.renderItem, this)
  }

  public reset() {
    this.simulation.resetPositions()
  }

  private renderItem(effect: ShaderEffect, i: number) {
    this.simulation.readObject(i, effect.getParameter<Mat4>('world'))
    effect.draw(this.mesh)
  }
}
