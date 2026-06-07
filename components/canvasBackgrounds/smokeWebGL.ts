const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);

  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);

  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));

  col=mix(vec3(.08),col,min(time*.1,1.));
  col=clamp(col,.08,1.);
  O=vec4(col,1);
}`;

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

const VERTICES = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);

/** Original shader speed × 0.3 */
export const SMOKE_TIME_SCALE = 0.3;

type Rgb = [number, number, number];

interface SmokeUniforms {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  u_color: WebGLUniformLocation | null;
}

export function hexToRgb(hex: string): Rgb | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1]!, 16) / 255,
        parseInt(result[2]!, 16) / 255,
        parseInt(result[3]!, 16) / 255,
      ]
    : null;
}

export class SmokeWebGLRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms: SmokeUniforms = {
    resolution: null,
    time: null,
    u_color: null,
  };
  private color: Rgb = [0.5, 0.5, 0.5];

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
    if (!gl) {
      throw new Error("WebGL2 not available");
    }
    this.canvas = canvas;
    this.gl = gl;
    this.setup();
    this.init();
  }

  updateColor(newColor: Rgb) {
    this.color = newColor;
  }

  resize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(nowMs = 0) {
    const { gl, program, buffer, canvas, uniforms, color } = this;
    if (!program || !buffer || !gl.isProgram(program)) return;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    if (uniforms.resolution) {
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    }
    if (uniforms.time) {
      gl.uniform1f(uniforms.time, nowMs * 1e-3 * SMOKE_TIME_SCALE);
    }
    if (uniforms.u_color) {
      gl.uniform3fv(uniforms.u_color, color);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    const { gl, program, vs, fs, buffer } = this;
    if (buffer) gl.deleteBuffer(buffer);
    if (program) {
      if (vs) {
        gl.detachShader(program, vs);
        gl.deleteShader(vs);
      }
      if (fs) {
        gl.detachShader(program, fs);
        gl.deleteShader(fs);
      }
      gl.deleteProgram(program);
    }
    this.buffer = null;
    this.program = null;
    this.vs = null;
    this.fs = null;
  }

  private compile(shader: WebGLShader, source: string) {
    const { gl } = this;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
    }
  }

  private setup() {
    const { gl } = this;
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!this.vs || !this.fs || !program) return;

    this.compile(this.vs, VERTEX_SHADER_SOURCE);
    this.compile(this.fs, FRAGMENT_SHADER_SOURCE);
    this.program = program;
    gl.attachShader(program, this.vs);
    gl.attachShader(program, this.fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Program linking error: ${gl.getProgramInfoLog(program)}`);
    }
  }

  private init() {
    const { gl, program } = this;
    if (!program) return;

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    this.uniforms = {
      resolution: gl.getUniformLocation(program, "resolution"),
      time: gl.getUniformLocation(program, "time"),
      u_color: gl.getUniformLocation(program, "u_color"),
    };
  }
}
