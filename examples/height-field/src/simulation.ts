import { Mat4 } from '@gglib/math'
import Ammo from 'ammojs-typed'

export class Simulation {
  public readonly config = new Ammo.btDefaultCollisionConfiguration()
  public readonly dispatcher = new Ammo.btCollisionDispatcher(this.config)
  public readonly broadphase = new Ammo.btDbvtBroadphase()
  public readonly solver = new Ammo.btSequentialImpulseConstraintSolver()
  public readonly world = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.config)
  public readonly bodies: Ammo.btRigidBody[] = []

  private transform = new Ammo.btTransform();

  constructor() {
    this.world.setGravity(new Ammo.btVector3(0, -6, 0))
  }

  public simulate(dt: number) {
    this.world.stepSimulation(dt, 2);
  }

  public readTransform(body: Ammo.btRigidBody, out: Mat4)  {
    const t = this.transform
    body.getMotionState().getWorldTransform(t)

    const o = t.getOrigin()
    const r = t.getRotation()
    out
      .initTranslation(o.x(), o.y(), o.z())
      .rotateQuaternion(r.x(), r.y(), r.z(), r.w())
  }

  public addBody(body: Ammo.btRigidBody) {
    this.world.addRigidBody(body)
    this.bodies.push(body)
  }
}
