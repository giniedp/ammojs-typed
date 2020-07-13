import { Device } from '@gglib/graphics'

export function createShader(device: Device) {
  return device.createProgram({ vertexShader, fragmentShader })
}

const vertexShader = `
  precision highp float;

  // @binding position
  attribute vec3 vPosition;
  // @binding normal
  attribute vec3 vNormal;
  // @binding texture
  attribute vec2 vTexture;

  // @binding world
  uniform mat4 uWorld;
  // @binding view
  uniform mat4 uView;
  // @binding projection
  uniform mat4 uProjection;

  // data for fragment stage
  varying vec3 normal;
  varying vec3 position;
  varying vec4 position_ps;
  varying vec2 texCoord;

  void main(void) {
    vec4 pos = uWorld * vec4(vPosition, 1.0);
    position_ps = uProjection * uView * pos;
    gl_Position = position_ps;

    normal = mat3(uWorld) * vNormal;
    position = pos.xyz;
    texCoord = vTexture;
  }
`

const fragmentShader = `
  precision highp float;

  // @binding diffuseColor
  // @default [1, 0, 0]
  uniform vec3 uDiffuseColor;
  // @binding lightColor
  // @default [1, 1, 1]
  uniform vec3 uLightColor;
  // @binding lightDirection
  // @default [0, 0, -1]
  uniform vec3 uLightDirection;
  // @binding eyePosition
  // @default [0, 0, 1]
  uniform vec3 uEyePosition;
  // @binding specularPower
  // @default 0.1
  uniform float uSpecularPower;

  // data from vertex stage
  varying vec3 normal;
  varying vec3 position;
  varying vec4 position_ps;
  varying vec2 texCoord;

  vec4 CalculateLightTerm(
    in vec3 E,   // Vector To Eye
    in vec3 N,   // Surface Normal
    in vec3 L,   // Vector To Light
    in float SP) // Specular Power
  {
    // diffuse term

    // float NdotL = max(0.0, dot(N, L));
    float NdotL = max(0.0, abs(dot(N, L))); // abs for backface
    vec4 result = vec4(NdotL, NdotL, NdotL, 0.0);

    // specular term
    if (NdotL > 0.0)
    {
      vec3 H = normalize(E + L);
      result.a = pow(abs(dot(N, H)), exp2(SP * 10.5) );
    }
    return result;
  }

  void main(void) {
    vec4 term = CalculateLightTerm(uEyePosition - position, normal, -uLightDirection, uSpecularPower);
    vec4 color = vec4(0.0);
    color.rgb = uLightColor * (term.rgb * uDiffuseColor.rgb.rgb + term.a);
    // color.rgb = vec3(position_ps.z - 4.0);
    color.a = 1.0;
    gl_FragColor = color;
  }
`
