export type Character = 'tanjiro' | 'nezuko';
export type Vec2 = [number, number];

export interface PortraitPose {
  gaze: Vec2;
  head: Vec2;
  hair: number;
  earrings: Vec2;
  time: number;
  frame: number;
  nextFrame: number;
  blend: number;
}

const VERTEX_SHADER = `
precision highp float;
attribute vec2 a_uv;
varying vec2 v_uv;
uniform vec2 u_head;
uniform float u_hair;
uniform vec2 u_earrings;
uniform float u_time;
uniform float u_character;
uniform float u_pivot;

float band(float x, float lo, float hi, float edge) {
  return smoothstep(lo-edge,lo+edge,x)*(1.0-smoothstep(hi-edge,hi+edge,x));
}
void main() {
  vec2 p=a_uv;
  float headWeight=1.0-smoothstep(u_pivot-0.045,u_pivot+0.10,p.y);
  vec2 anchor=vec2(mix(0.6124,0.5191,u_character),u_pivot);
  // Rotate around the neck, keeping shoulders planted. Horizontal compression
  // and a curved horizontal offset suggest a small turn in depth.
  float roll=-u_head.x*0.055;
  vec2 q=(p-anchor)*vec2(1.0,1.5);
  vec2 rotated=vec2(cos(roll)*q.x-sin(roll)*q.y,sin(roll)*q.x+cos(roll)*q.y);
  rotated.x*=1.0-abs(u_head.x)*0.035;
  rotated/=vec2(1.0,1.5);
  vec2 turn=rotated+anchor-p;
  turn.x+=u_head.x*0.038*(1.0-smoothstep(0.18,u_pivot,p.y));
  turn.y+=u_head.y*0.018*(1.0-smoothstep(0.20,u_pivot,p.y));
  p+=turn*headWeight;

  // Hair is a separate soft region: roots remain still, tips lag behind the head.
  float crown=(1.0-smoothstep(0.24,0.40,a_uv.y));
  float leftHair=(1.0-smoothstep(0.27,0.38,a_uv.x))*band(a_uv.y,0.16,0.54,0.06);
  float rightHair=smoothstep(0.78,0.90,a_uv.x)*band(a_uv.y,0.10,0.53,0.06);
  float tanjiroHair=max(crown,max(leftHair,rightHair));
  float longHair=(1.0-band(a_uv.x,0.32,0.72,0.06))*smoothstep(0.16,0.72,a_uv.y);
  float nezukoHair=max(crown,longHair);
  float hairWeight=mix(tanjiroHair,nezukoHair,u_character);
  float hairMotion=u_hair+sin(u_time*1.3+a_uv.y*8.0)*0.0022;
  p.x+=hairWeight*hairMotion;
  p.y+=hairWeight*sin(u_time*1.55+a_uv.x*7.0)*0.0013;

  // Two independently damped pendulums attached to the earlobes.
  float leftEarring=band(a_uv.x,0.313,0.378,0.013)*band(a_uv.y,0.559,0.69,0.010);
  float rightEarring=band(a_uv.x,0.782,0.842,0.012)*band(a_uv.y,0.554,0.69,0.010);
  float earringLength=smoothstep(0.554,0.68,a_uv.y);
  p.x+=(leftEarring*u_earrings.x+rightEarring*u_earrings.y)*earringLength*(1.0-u_character);
  // Nezuko's ribbon and loose ends respond independently to the breeze.
  float ribbon=band(a_uv.x,0.72,0.93,0.022)*band(a_uv.y,0.12,0.35,0.025);
  p.x+=ribbon*(u_hair*0.7+sin(u_time*1.8)*0.0025)*u_character;
  p.y+=ribbon*sin(u_time*1.6)*0.0014*u_character;
  v_uv=a_uv;
  // A small transparent border prevents moving hair from hitting the tile edge.
  p=p*0.94+vec2(0.03);
  gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);
}`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_atlas;
uniform vec2 u_gaze;
uniform vec4 u_eyes;
uniform vec2 u_eyeSize;
uniform float u_frame;
uniform float u_nextFrame;
uniform float u_blend;
uniform float u_character;

float eyeMask(vec2 uv,vec2 center) {
  return 1.0-smoothstep(0.48,1.0,length((uv-center)/u_eyeSize));
}
vec4 sampleFrame(float frame) {
  vec2 uv=v_uv;
  float openEyes=1.0-step(2.5,frame)+step(4.5,frame);
  float eyes=max(eyeMask(uv,u_eyes.xy),eyeMask(uv,u_eyes.zw))*openEyes;
  // Move iris texture within its socket in both axes, keeping lids in place.
  uv-=u_gaze*vec2(0.016,0.0085)*eyes;
  // Register the generated expression tiles against the neutral portrait.
  // Without this correction, the whole head jumps when the eyelids close.
  vec2 offset=vec2(0.0);
  if(frame>0.5&&frame<1.5) offset=vec2(mix(-9.0,-11.0,u_character),0.0);
  if(frame>1.5&&frame<2.5) offset=vec2(mix(-18.0,-13.0,u_character),0.0);
  if(frame>2.5&&frame<3.5) offset=vec2(0.0,mix(-18.0,-24.0,u_character));
  if(frame>3.5&&frame<4.5) offset=vec2(mix(-8.0,-11.0,u_character),mix(-18.0,-24.0,u_character));
  if(frame>4.5) offset=vec2(mix(-18.0,-13.0,u_character),mix(-18.0,-23.0,u_character));
  uv+=offset/vec2(418.0,627.0);
  if(uv.x<0.0012||uv.x>0.9988||uv.y<0.0012||uv.y>0.9988) return vec4(0.0);
  uv=clamp(uv,vec2(0.0012),vec2(0.9988));
  vec2 cell=vec2(mod(frame,3.0),floor(frame/3.0));
  return texture2D(u_atlas,(uv+cell)/vec2(3.0,2.0));
}
void main() { gl_FragColor=mix(sampleFrame(u_frame),sampleFrame(u_nextFrame),u_blend); }
`;

export interface PortraitRenderer {
  draw: (pose: PortraitPose) => void;
  destroy: () => void;
}

export function createPortraitRenderer(canvas: HTMLCanvasElement, atlas: HTMLImageElement, character: Character): PortraitRenderer | null {
  const gl=canvas.getContext('webgl', {alpha:true,premultipliedAlpha:false,antialias:true,preserveDrawingBuffer:true});
  if(!gl) return null;
  const compile=(kind: number, source: string) => {
    const shader=gl.createShader(kind)!;
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Portrait shader unavailable'); }
    return shader;
  };
  let vertex: WebGLShader; let fragment: WebGLShader;
  try { vertex=compile(gl.VERTEX_SHADER,VERTEX_SHADER); fragment=compile(gl.FRAGMENT_SHADER,FRAGMENT_SHADER); }
  catch { return null; }
  const program=gl.createProgram()!; gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) { gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);return null; }
  gl.useProgram(program);
  const vertices:number[]=[];
  const cols=48,rows=72;
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
    const l=x/cols,r=(x+1)/cols,t=y/rows,b=(y+1)/rows;
    vertices.push(l,t,r,t,l,b,r,t,r,b,l,b);
  }
  const buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'a_uv');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture()!;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
  const names=['head','hair','earrings','time','character','pivot','gaze','eyes','eyeSize','frame','nextFrame','blend','atlas'];
  const uniforms=Object.fromEntries(names.map(name=>[name,gl.getUniformLocation(program,`u_${name}`)]));
  gl.uniform1i(uniforms.atlas,0);gl.uniform1f(uniforms.character,character==='nezuko'?1:0);
  gl.uniform1f(uniforms.pivot,character==='tanjiro'?0.6715:0.6029);
  gl.uniform4f(uniforms.eyes,...(character==='tanjiro'?[0.4818,0.4699,0.7215,0.4710]:[0.4108,0.4059,0.6364,0.3949]) as [number,number,number,number]);
  gl.uniform2f(uniforms.eyeSize,character==='tanjiro'?0.067:0.071,character==='tanjiro'?0.043:0.037);
  gl.clearColor(0,0,0,0);
  const resize=() => { const box=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2); const width=Math.max(1,Math.round(box.width*dpr)); const height=Math.max(1,Math.round(box.height*dpr)); if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}gl.viewport(0,0,width,height); };
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  return {
    draw(pose) {
      gl.uniform2f(uniforms.gaze,...pose.gaze);gl.uniform2f(uniforms.head,...pose.head);
      gl.uniform1f(uniforms.hair,pose.hair);gl.uniform2f(uniforms.earrings,...pose.earrings);
      gl.uniform1f(uniforms.time,pose.time);gl.uniform1f(uniforms.frame,pose.frame);gl.uniform1f(uniforms.nextFrame,pose.nextFrame);gl.uniform1f(uniforms.blend,pose.blend);
      gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2);
    },
    destroy() { observer.disconnect();gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment); },
  };
}
