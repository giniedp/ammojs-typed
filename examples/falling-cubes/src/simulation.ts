import { Mat4 } from '@gglib/math'
import Ammo from 'ammojs-typed'

export class Simulation {
  public readonly config = new Ammo.btDefaultCollisionConfiguration()
  public readonly dispatcher = new Ammo.btCollisionDispatcher(this.config)
  public readonly overlappingPairCache = new Ammo.btDbvtBroadphase()
  public readonly solver = new Ammo.btSequentialImpulseConstraintSolver()
  public readonly world = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.overlappingPairCache, this.solver, this.config)
  public readonly bodies: Ammo.btRigidBody[] = []

  private boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
  private transform = new Ammo.btTransform();

  public constructor(public readonly numBoxes = 100) {
    this.createGroundShape()
    this.init()
  }

  private createGroundShape() {
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50))
    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(0, -56, 0))

    var mass = 0;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    var myMotionState = new Ammo.btDefaultMotionState(transform);
    var rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, shape, localInertia);
    var body = new Ammo.btRigidBody(rbInfo);

    this.world.addRigidBody(body);
    this.bodies.push(body);
  }

  public resetPositions() {
    const boxCount = this.bodies.length - 1
    var side = Math.ceil(Math.pow(boxCount, 1/3));
    var i = 1;
    for (var y = 0; y < side; y++) {
      for (var z = 0; z < side; z++) {
        for (var x = 0; x < side; x++) {
          if (i == this.bodies.length) {
            return
          }
          var body = this.bodies[i++];
          var origin = body.getWorldTransform().getOrigin();
          origin.setX((x - side/2 + 0.5)*(2.2 + Math.random()));
          origin.setY(y * (3 + Math.random()));
          origin.setZ((z - side/2 + 0.5)*(2.2 + Math.random()));
          var rotation = body.getWorldTransform().getRotation();
          rotation.setX(1);
          rotation.setY(0);
          rotation.setZ(0);
          rotation.setW(1);
          body.activate();
        }
      }
    }
  }

  public init() {
    for (let i = 0; i < this.numBoxes; i++) {
      var startTransform = new Ammo.btTransform();
      startTransform.setIdentity();
      var mass = 1;
      var localInertia = new Ammo.btVector3(0, 0, 0);
      this.boxShape.calculateLocalInertia(mass, localInertia);

      var myMotionState = new Ammo.btDefaultMotionState(startTransform);
      var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, this.boxShape, localInertia);
      var body = new Ammo.btRigidBody(rbInfo);

      this.world.addRigidBody(body);
      this.bodies.push(body);
    };
    this.resetPositions()
  }

  public simulate(dt: number) {
    this.world.stepSimulation(dt, 2);
  }

  public readObject(i: number, m: Mat4) {
    const body = this.bodies[i]
    const t = this.transform
    body.getMotionState().getWorldTransform(t)

    const o = t.getOrigin()
    const r = t.getRotation()

    m
      .initTranslation(o.x(), o.y(), o.z())
      .rotateQuaternion(r.x(), r.y(), r.z(), r.w())
  }
}
