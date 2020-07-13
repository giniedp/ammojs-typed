import Ammo from "ammojs-typed";
import { Mat4, Vec3 } from "@gglib/math";
import {
  Device,
  ModelMesh,
  ModelBuilder,
  ShaderEffect,
  ShaderProgram,
  buildCube,
  buildSphere,
  buildCylinder,
  buildCone,
  buildParametricSurface,
} from "@gglib/graphics";

import { createShader } from "./shader";
import { Simulation } from "./simulation";


export interface TerrainOptions {
  width: number
  depth: number
  minHeight: number
  maxHeight: number
}

export class Scene {
  private options: TerrainOptions = {
    width: 128,
    depth: 128,
    maxHeight: 5,
    minHeight: -5,
  };

  private device: Device;
  private program: ShaderProgram;

  private view = Mat4.createIdentity();
  private projection = Mat4.createIdentity();
  private viewPosition = Vec3.create(0, 30, 50);

  private simulation = new Simulation();
  private objects: SceneObject[] = [];
  private groundTransform = new Ammo.btTransform();

  public constructor(canvas: HTMLCanvasElement) {
    this.device = new Device({ canvas: canvas });
    this.program = createShader(this.device);

    this.generateTerrain()
    for (let i = 0; i < 30; i++) {
      this.generateObject();
    }
  }

  public update(dt: number) {
    this.simulation.simulate(dt);
  }

  public draw() {
    this.device.clear();
    this.device.resize();
    this.view
      .initLookAt(
        this.viewPosition,
        Vec3.Zero,
        Vec3.UnitY
      )
      .invert();
    this.projection.initPerspectiveFieldOfView(
      Math.PI / 3,
      this.device.drawingBufferAspectRatio,
      0.1,
      200
    );
    this.objects.forEach((item) => {
      const t = item.effect.getParameter<Mat4>("world")
      this.simulation.readTransform(item.body, t);
      item.effect.draw(item.mesh);
    });
  }

  private generateTerrain() {
    const options = this.options

    // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
    const heightScale = 1;

    // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
    const upAxis = 1;

    // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
    const hdt = "PHY_FLOAT";

    // Set this to your needs (inverts the triangles)
    const flipQuadEdges = false;

    // Creates height data buffer in Ammo heap
    const heightDataPtr = Ammo._malloc(4 * options.width * options.depth);
    const heightData = generateHeight(options)

    // Copy the javascript height data array to the Ammo one.
    let p = 0;
    let p2 = 0;
    for (let j = 0; j < options.depth; j++) {
      for (let i = 0; i < options.width; i++) {
        // write 32-bit float data to memory
        Ammo.HEAPF32[(heightDataPtr + p2) >> 2] = heightData[p];
        p++;
        // 4 bytes/float
        p2 += 4;
      }
    }

    // Creates the heightfield physics shape
    const shape = new Ammo.btHeightfieldTerrainShape(
      options.width,
      options.depth,

      heightDataPtr,

      heightScale,
      options.minHeight,
      options.maxHeight,

      upAxis,
      hdt,
      flipQuadEdges
    );

    // Set horizontal scale
    shape.setLocalScaling(new Ammo.btVector3(1, 1, 1));
    shape.setMargin(0.05);

    this.groundTransform.setIdentity();
    // Shifts the terrain, since bullet re-centers it on its bounding box.
    this.groundTransform.setOrigin(
      new Ammo.btVector3(0, 0, 0)
    );
    const groundMass = 0;
    const groundLocalInertia = new Ammo.btVector3(0, 0, 0);
    const groundMotionState = new Ammo.btDefaultMotionState(this.groundTransform);
    const groundBody = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(
        groundMass,
        groundMotionState,
        shape,
        groundLocalInertia
      )
    );

    this.objects.push({
      body: groundBody,
      mesh: ModelBuilder.begin().tap((b) => {
        buildParametricSurface(b, {
          tu: options.width,
          tv: options.depth,
          f: (u, v) => {
            const x = Math.floor(u * options.width)
            const y = Math.floor(v * options.depth)
            return {
              x: x - options.width / 2,
              y: heightData[y * options.width + x],
              z: y - options.depth / 2
            }
          }
        })
      }).endMesh(this.device),
      effect: this.device.createEffect({
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
      }),
    });
    this.simulation.addBody(groundBody);
  }

  private generateObject() {
    const device = this.device;
    const numTypes = 4;
    const objectType = Math.ceil(Math.random() * numTypes);

    const objectSize = 3;
    const margin = 0.05;

    let mesh: ModelMesh = null;
    let shape: Ammo.btCollisionShape = null;

    switch (objectType) {
      // Sphere
      case 1: {
        const radius = 1 + Math.random() * objectSize;
        mesh = ModelBuilder.begin()
          .tap((b) => buildSphere(b, { radius: radius }))
          .endMesh(device);
        shape = new Ammo.btSphereShape(radius);
        shape.setMargin(margin);
        break;
      }
      // Box
      case 2: {
        const size = 1 + Math.random() * objectSize;
        mesh = ModelBuilder.begin()
          .tap((b) =>
            buildCube(b, {
              size: size,
            })
          )
          .endMesh(device);
        shape = new Ammo.btBoxShape(
          new Ammo.btVector3(size * 0.5, size * 0.5, size * 0.5)
        );
        shape.setMargin(margin);
        break;
      }
      // Cylinder
      case 3: {
        const radius = 1 + Math.random() * objectSize;
        const height = 1 + Math.random() * objectSize;
        mesh = ModelBuilder.begin()
          .tap((b) =>
            buildCylinder(b, {
              height: height,
              radius: radius,
            })
          )
          .endMesh(device);
        shape = new Ammo.btCylinderShape(
          new Ammo.btVector3(radius, height * 0.5, radius)
        );
        shape.setMargin(margin);
        break;
      }
      // Cone
      default: {
        const radius = 1 + Math.random() * objectSize;
        const height = 2 + Math.random() * objectSize;
        mesh = ModelBuilder.begin()
          .tap((b) =>
            buildCone(b, {
              height: height,
              upperRadius: 0,
              lowerRadius: radius,
            })
          )
          .endMesh(device);
        shape = new Ammo.btConeShape(radius, height);
        break;
      }
    }

    const mass = objectSize * 5;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(
      new Ammo.btVector3(
        (Math.random() - 0.5) * this.options.width * 0.6,
        this.options.maxHeight + objectSize + 2,
        (Math.random() - 0.5) * this.options.depth * 0.6
      )
    );

    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(
        mass,
        new Ammo.btDefaultMotionState(transform),
        shape,
        localInertia
      )
    );

    this.objects.push({
      body: body,
      mesh: mesh,
      effect: this.device.createEffect({
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
      }),
    });
    this.simulation.addBody(body);
  }
}

export interface SceneObject {
  mesh: ModelMesh;
  body: Ammo.btRigidBody;
  effect: ShaderEffect;
}

function generateHeight({ width, depth, minHeight, maxHeight }: TerrainOptions) {
  // Generates the height data (a sinus wave)

  let size = width * depth;
  let data = new Float32Array(size);

  let hRange = maxHeight - minHeight;
  let w2 = width / 2;
  let d2 = depth / 2;
  let phaseMult = 12;

  let p = 0;
  for (let j = 0; j < depth; j++) {
    for (let i = 0; i < width; i++) {
      let radius = Math.sqrt(
        Math.pow((i - w2) / w2, 2.0) + Math.pow((j - d2) / d2, 2.0)
      );

      let height =
        (Math.sin(radius * phaseMult) + 1) * 0.5 * hRange + minHeight;

      data[p] = height;

      p++;
    }
  }

  return data;
}
