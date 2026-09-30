import { useEffect, useRef, useState } from 'react';
import { assetUrl } from './sitePaths';

type Pair=[number,number];
type Actor={head:[number,number,number,number];eyes:[number,number,number,number];hair:[number,number,number,number];earrings?:boolean};
const actors:Record<number,Actor[]>={
 1:[{head:[.221,.24,.08,.15],eyes:[.205,.255,.259,.217],hair:[.078,.003,.296,.377]},{head:[.416,.315,.075,.14],eyes:[.399,.331,.452,.300],hair:[.288,.113,.529,.506]},{head:[.704,.429,.10,.16],eyes:[.691,.431,.756,.401],hair:[.542,.127,.801,.568],earrings:true}],
 2:[{head:[.323,.239,.07,.11],eyes:[.322,.224,.358,.249],hair:[.223,.039,.393,.299]},{head:[.659,.359,.085,.13],eyes:[.608,.354,.639,.352],hair:[.576,.124,.795,.444],earrings:true}],
 3:[{head:[.340,.374,.125,.19],eyes:[.284,.377,.368,.354],hair:[.168,0,.520,.448],earrings:true},{head:[.572,.256,.10,.17],eyes:[.549,.238,.607,.284],hair:[.449,.010,.699,.402]}],
 4:[{head:[.269,.154,.08,.13],eyes:[.264,.129,.293,.157],hair:[.089,0,.343,.251]},{head:[.526,.275,.095,.16],eyes:[.500,.289,.556,.282],hair:[.400,.064,.661,.372]},{head:[.849,.572,.09,.16],eyes:[.808,.516,.842,.534],hair:[.781,.336,1,.685],earrings:true}],
};
const vertex=`precision highp float;
attribute vec2 a_uv;varying vec2 v_uv;
uniform vec4 u_head[3];uniform vec4 u_hairBounds[3];uniform vec2 u_gaze[3];uniform vec2 u_turn[3];uniform vec2 u_secondary[3];uniform float u_hasEarrings[3];uniform float u_time;uniform float u_chapter;uniform float u_idle;uniform vec2 u_cover;uniform vec2 u_center;
float band(float x,float a,float b,float e){return smoothstep(a-e,a+e,x)*(1.0-smoothstep(b-e,b+e,x));}
void main(){vec2 p=a_uv;for(int i=0;i<3;i++){
 vec4 h=u_head[i];if(h.z<0.001)continue;
 float mask=1.0-smoothstep(.55,1.25,length((a_uv-h.xy)/h.zw));
 vec2 pivot=h.xy+vec2(0.0,h.w*.83);vec2 q=(a_uv-pivot)*vec2(1.75,1.0);
 float angle=-u_turn[i].x*.035;vec2 r=vec2(cos(angle)*q.x-sin(angle)*q.y,sin(angle)*q.x+cos(angle)*q.y)/vec2(1.75,1.0);
 p+=(r+pivot-a_uv+u_turn[i]*vec2(.006,.004))*mask;
 vec4 hb=u_hairBounds[i];float hair=band(a_uv.x,hb.x,hb.z,.018)*band(a_uv.y,hb.y,hb.w,.024);
 float root=1.0-smoothstep(h.y-h.w*.3,h.y+h.w*.8,a_uv.y);
 p.x+=hair*root*(u_secondary[i].x+sin(u_time*1.3+float(i))*0.0011*u_idle);
 p.y+=hair*root*sin(u_time*1.6+float(i))*.0006*u_idle;
 float earX=band(abs(a_uv.x-h.x),h.z*.62,h.z*1.03,.012);
 float earY=band(a_uv.y,h.y+h.w*.36,h.y+h.w*1.16,.025);
 p.x+=earX*earY*u_hasEarrings[i]*u_secondary[i].y*smoothstep(h.y,h.y+h.w,a_uv.y);
 }
 // Each memory has its own small gesture, with the scenery kept in place.
 float beat=sin(u_time*1.4)*u_idle;
 if(u_chapter==1.0){
  float hands=band(a_uv.x,.55,.82,.025)*band(a_uv.y,.70,.92,.035);
  float basket=band(a_uv.x,.405,.63,.025)*band(a_uv.y,.52,.95,.035);
  float sisterHand=band(a_uv.x,.43,.50,.012)*band(a_uv.y,.52,.65,.025);
  p.y+=beat*(hands*.0024+basket*.0011);p.x+=sisterHand*beat*.0014;
 }else if(u_chapter==2.0){
  float lamp=band(a_uv.x,.074,.224,.012)*band(a_uv.y,.465,.937,.016);
  vec2 q=(a_uv-vec2(.171,.478))*vec2(1.75,1.0);float a=sin(u_time*.95)*.018*u_idle;
  vec2 swing=vec2(cos(a)*q.x-sin(a)*q.y,sin(a)*q.x+cos(a)*q.y)/vec2(1.75,1.0);
  p+=(swing+vec2(.171,.478)-a_uv)*lamp;
 }else if(u_chapter==3.0){
  float shoulder=band(a_uv.x,.012,.245,.04)*band(a_uv.y,.35,.705,.04);
  float clothes=band(a_uv.x,.145,.854,.04)*band(a_uv.y,.55,1.0,.04);
  float flyingHair=band(a_uv.x,.7,.89,.03)*band(a_uv.y,.26,.65,.04);
  p.y+=sin(u_time*3.8)*u_idle*(shoulder*.0032+clothes*.0021);
  p.x+=flyingHair*sin(u_time*1.7)*.0035*u_idle;
 }else{
  float hand=band(a_uv.x,.174,.315,.015)*band(a_uv.y,.505,.669,.022);
  float sleeve=band(a_uv.x,.176,.473,.025)*band(a_uv.y,.418,.711,.026);
  p.x-=(hand*.0025+sleeve*.0011)*sin(u_time*1.1)*u_idle;
  float sword=band(a_uv.x,.08,.257,.014)*band(a_uv.y,.60,.94,.015);
  p.x+=sword*sin(u_time*.8)*.0025*u_idle*smoothstep(.63,.94,a_uv.y);
 }
 float action=exp(-pow((a_uv.x-.50)/.29,2.0)-pow((a_uv.y-.69)/.22,2.0));
 p.y+=sin(u_time*(u_chapter==3.0?2.1:1.1))*action*(u_chapter==3.0?.0015:.0005)*u_idle;
 v_uv=a_uv;gl_Position=vec4((p.x-u_center.x)*2.0*u_cover.x,(u_center.y-p.y)*2.0*u_cover.y,0.0,1.0);}`;
const fragment=`precision highp float;varying vec2 v_uv;uniform sampler2D u_image;uniform vec4 u_eyes[3];uniform vec2 u_eyeSize[3];uniform vec2 u_gaze[3];
float eye(vec2 p,vec2 center,vec2 size){return 1.0-smoothstep(.4,1.0,length((p-center)/size));}
void main(){vec2 uv=v_uv;for(int i=0;i<3;i++){if(u_eyeSize[i].x<.001)continue;float mask=max(eye(v_uv,u_eyes[i].xy,u_eyeSize[i]),eye(v_uv,u_eyes[i].zw,u_eyeSize[i]));uv-=u_gaze[i]*vec2(.0042,.004)*mask;}gl_FragColor=texture2D(u_image,clamp(uv,vec2(.001),vec2(.999)));}`;

export default function StoryScene({chapter,paused,alt}:{chapter:number;paused:boolean;alt:string}){
 const canvasRef=useRef<HTMLCanvasElement>(null),hostRef=useRef<HTMLDivElement>(null),pausedRef=useRef(paused),kickRef=useRef<()=>void>(()=>{});
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{pausedRef.current=paused;kickRef.current();},[paused]);
 useEffect(()=>{
  const canvas=canvasRef.current!,host=hostRef.current!,motion=matchMedia('(prefers-reduced-motion: reduce)');let disposed=false,visible=false,raf=0,last=0,time=0;
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});if(!gl)return;
  let program:WebGLProgram|null=null,texture:WebGLTexture|null=null,buffer:WebGLBuffer|null=null;
  const shaders:WebGLShader[]=[];let resizeObserver:ResizeObserver|undefined;
  const target:Pair[]=actors[chapter].map(()=>[0,0]),gaze:Pair[]=actors[chapter].map(()=>[0,0]),turn:Pair[]=actors[chapter].map(()=>[0,0]),secondary:Pair[]=actors[chapter].map(()=>[0,0]);
  let uniforms:Record<string,WebGLUniformLocation|null>={};let count=0,cover:Pair=[1,1],center:Pair=[.5,.5];
  const camera=():Pair=>{if(innerWidth>=768)return [.5,.5];const section=host.closest('.chapter')!,rect=section.getBoundingClientRect();const progress=Math.max(0,Math.min(1,(-rect.top)/Math.max(1,rect.height-innerHeight)));const ranges=[[.33,.70],[.32,.66],[.34,.57],[.30,.78]];const [start,end]=ranges[chapter-1];return [Math.max(.5/cover[0],Math.min(1-.5/cover[0],start+(end-start)*progress)),chapter===4?.34+progress*.30:.5];};
  const resize=()=>{const box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75),w=Math.max(1,Math.round(box.width*dpr)),h=Math.max(1,Math.round(box.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);const ratio=box.width/Math.max(1,box.height),zoom=innerWidth<768?(chapter===4?1.5:1.2):1;cover=[Math.max(1,1.75/ratio)*zoom,Math.max(1,ratio/1.75)*zoom];const focus=innerWidth<768?[.72,.70,.35,.52][chapter-1]:.5;center=[.5+(focus-.5)*(1-1/cover[0]),innerWidth<768&&chapter===4?.34:.5];gl.uniform2f(uniforms.cover,...cover);gl.uniform2f(uniforms.center,...center);};
  const draw=(now:number)=>{
   raf=0;if(disposed||!program||!visible)return;
   const dt=Math.max(1/240,Math.min(last?(now-last)/1000:1/60,.04));last=now;
   if(!pausedRef.current){const view=camera(),cameraEase=1-Math.exp(-dt*4);center[0]+=(view[0]-center[0])*cameraEase;center[1]+=(view[1]-center[1])*cameraEase;if(!motion.matches)time+=dt;const idle=motion.matches?0:1,ease=1-Math.exp(-dt*10),headEase=1-Math.exp(-dt*4.2);
    actors[chapter].forEach((_,i)=>{gaze[i][0]+=(target[i][0]-gaze[i][0])*ease;gaze[i][1]+=(target[i][1]-gaze[i][1])*ease;const old=turn[i][0];turn[i][0]+=(target[i][0]*.7-turn[i][0])*headEase;turn[i][1]+=(target[i][1]*.7-turn[i][1])*headEase;const velocity=(turn[i][0]-old)/dt;secondary[i][0]+=(-velocity*.0016+Math.sin(time*1.2+i)*.0014*idle-secondary[i][0])*(1-Math.exp(-dt*3));secondary[i][1]+=(-velocity*.0032+Math.sin(time*1.7+i)*.002*idle-secondary[i][1])*(1-Math.exp(-dt*4));});
   }
   for(let i=0;i<3;i++){gl.uniform2f(uniforms[`gaze${i}`],...(gaze[i]??[0,0]));gl.uniform2f(uniforms[`turn${i}`],...(turn[i]??[0,0]));gl.uniform2f(uniforms[`secondary${i}`],...(secondary[i]??[0,0]));}
   gl.uniform2f(uniforms.center,...center);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.idle,motion.matches?0:1);gl.drawArrays(gl.TRIANGLES,0,count);host.dataset.gaze=gaze.map(p=>p.map(n=>n.toFixed(2)).join(',')).join(';');host.dataset.camera=center[0].toFixed(3);
   if(!pausedRef.current)raf=requestAnimationFrame(draw);
  };
  const kick=()=>{if(!raf&&visible&&program)raf=requestAnimationFrame(draw);};kickRef.current=kick;
  const move=(e:PointerEvent)=>{if(e.pointerType!=='mouse'||pausedRef.current)return;const box=canvas.getBoundingClientRect();actors[chapter].forEach((actor,i)=>{const faceX=box.left+box.width*(.5+(actor.head[0]-center[0])*cover[0]),faceY=box.top+box.height*(.5+(actor.head[1]-center[1])*cover[1]);target[i][0]=Math.max(-1,Math.min(1,(e.clientX-faceX)/Math.max(box.width*.55,200)));target[i][1]=Math.max(-1,Math.min(1,(e.clientY-faceY)/Math.max(box.height*.8,200)));});kick();};
  const reset=()=>{target.forEach(p=>{p[0]=0;p[1]=0;});kick();};
  const contextLost=()=>{setReady(false);host.dataset.renderer='image';if(raf){cancelAnimationFrame(raf);raf=0;}program=null;};
  canvas.addEventListener('webglcontextlost',contextLost);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;kick();}else if(raf){cancelAnimationFrame(raf);raf=0;}},{rootMargin:'120px'});observer.observe(host);
  const image=new Image();image.onload=()=>{
   if(disposed)return;
   try{
    const compile=(kind:number,source:string)=>{const shader=gl.createShader(kind)!;shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Scene shader unavailable');return shader;};
    program=gl.createProgram()!;gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Scene renderer unavailable');gl.useProgram(program);
    const data:number[]=[];for(let y=0;y<58;y++)for(let x=0;x<82;x++){const l=x/82,r=(x+1)/82,t=y/58,b=(y+1)/58;data.push(l,t,r,t,l,b,r,t,r,b,l,b);}count=data.length/2;
    buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'a_uv');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
    texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
    uniforms={time:gl.getUniformLocation(program,'u_time'),chapter:gl.getUniformLocation(program,'u_chapter'),idle:gl.getUniformLocation(program,'u_idle'),cover:gl.getUniformLocation(program,'u_cover'),center:gl.getUniformLocation(program,'u_center')};gl.uniform1f(uniforms.chapter,chapter);
    for(let i=0;i<3;i++){
     const actor=actors[chapter][i];for(const name of ['gaze','turn','secondary'])uniforms[`${name}${i}`]=gl.getUniformLocation(program,`u_${name}[${i}]`);
     gl.uniform4f(gl.getUniformLocation(program,`u_head[${i}]`),...(actor?.head??[0,0,0,0]));gl.uniform4f(gl.getUniformLocation(program,`u_hairBounds[${i}]`),...(actor?.hair??[0,0,0,0]));gl.uniform4f(gl.getUniformLocation(program,`u_eyes[${i}]`),...(actor?.eyes??[0,0,0,0]));gl.uniform2f(gl.getUniformLocation(program,`u_eyeSize[${i}]`),actor?.head[2]?actor.head[2]*.25:0,actor?.head[3]?actor.head[3]*.16:0);gl.uniform1f(gl.getUniformLocation(program,`u_hasEarrings[${i}]`),actor?.earrings?1:0);
    }
    resizeObserver=new ResizeObserver(()=>{resize();kick();});resizeObserver.observe(canvas);resize();setReady(true);host.dataset.renderer='mesh';kick();
   }catch{setReady(false);host.dataset.renderer='image';}
  };image.onerror=()=>{if(!disposed)setFailed(true);};image.src=assetUrl(`scene-0${chapter}.png`);
  window.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',reset);document.documentElement.addEventListener('pointerleave',reset);
  return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();resizeObserver?.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);document.documentElement.removeEventListener('pointerleave',reset);image.onload=null;image.onerror=null;if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));kickRef.current=()=>{};};
 },[chapter]);
 return <div ref={hostRef} className={`scene-rig scene-${chapter} ${ready?'ready':''} ${paused?'paused':''}`}><img src={assetUrl(`scene-0${chapter}.png`)} alt={alt} loading="lazy" className="scene-poster"/><canvas ref={canvasRef} className="scene-canvas" aria-hidden="true"/><div className="scene-atmosphere" aria-hidden="true"/>{failed&&<span className="scene-error">Immagine non disponibile.</span>}</div>;
}
