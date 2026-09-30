import { useEffect, useRef, useState } from 'react';
import { createPortraitRenderer } from './portraitRig';
import type { Character, PortraitPose, PortraitRenderer } from './portraitRig';

const clamp=(value:number,min=-1,max=1)=>Math.max(min,Math.min(max,value));
export default function AnimatedPortrait({character,paused}:{character:Character;paused:boolean}) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const containerRef=useRef<HTMLDivElement>(null);
  const pausedRef=useRef(paused);
  const [loaded,setLoaded]=useState(false);
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);
  const [fallbackFrame,setFallbackFrame]=useState(0);
  useEffect(()=>{pausedRef.current=paused;},[paused]);
  useEffect(()=>{
    const canvas=canvasRef.current!;
    let disposed=false,raf=0,renderer:PortraitRenderer|null=null;
    let rendererFailed=false;
    let targetX=0,targetY=0,last=0,elapsed=0,nextBlink=1.4,nextSmile=8,blinkStart=-10,smileUntil=0;
    let previousHead=0,hairVelocity=0,leftVelocity=0,rightVelocity=0;
    const pose:PortraitPose={gaze:[0,0],head:[0,0],hair:0,earrings:[0,0],time:0,frame:0,nextFrame:0,blend:0};
    const query=matchMedia('(prefers-reduced-motion: reduce)');
    const reset=()=>{targetX=0;targetY=0;};
    const move=(event:PointerEvent)=>{
      if(event.pointerType!=='mouse'||pausedRef.current) return;
      const rect=canvas.getBoundingClientRect();
      const centerX=rect.left+rect.width*.55,centerY=rect.top+rect.height*(character==='tanjiro'?.46:.40);
      targetX=clamp((event.clientX-centerX)/Math.max(innerWidth*.34,200));
      targetY=clamp((event.clientY-centerY)/Math.max(innerHeight*.42,180));
    };
    const update=(now:number)=>{
      if(disposed) return;
      // Some browser captures deliver repeated animation timestamps. A zero
      // delta would poison the velocity-based springs with NaN.
      const dt=Math.max(1/240,Math.min(last?(now-last)/1000:1/60,.045));last=now;
      if(!pausedRef.current && !document.hidden) {
        if(!query.matches)elapsed+=dt;
        // The user's explicit mouse animation remains enabled. A system motion
        // preference lowers the head amplitude; it does not disable gaze.
        const amplitude=query.matches?.7:1;
        const eyeEase=1-Math.exp(-dt*14),headEase=1-Math.exp(-dt*5.5);
        pose.gaze[0]+=(targetX-pose.gaze[0])*eyeEase;pose.gaze[1]+=(targetY-pose.gaze[1])*eyeEase;
        pose.head[0]+=(targetX*amplitude-pose.head[0])*headEase;pose.head[1]+=(targetY*amplitude-pose.head[1])*headEase;
        const headVelocity=(pose.head[0]-previousHead)/dt;previousHead=pose.head[0];
        // Hair and each earring have their own springs, so they lag then settle.
        const idle=query.matches?0:1;
        const hairTarget=-headVelocity*.004+Math.sin(elapsed*1.15)*.003*idle;
        hairVelocity+=(hairTarget-pose.hair)*dt*38;hairVelocity*=Math.exp(-dt*5);pose.hair=clamp(pose.hair+hairVelocity*dt,-.018,.018);
        const leftTarget=-headVelocity*.008+Math.sin(elapsed*1.85)*.005*idle;
        const rightTarget=-headVelocity*.006+Math.sin(elapsed*1.65+.9)*.004*idle;
        leftVelocity+=(leftTarget-pose.earrings[0])*dt*52;leftVelocity*=Math.exp(-dt*3.9);pose.earrings[0]=clamp(pose.earrings[0]+leftVelocity*dt,-.028,.028);
        rightVelocity+=(rightTarget-pose.earrings[1])*dt*44;rightVelocity*=Math.exp(-dt*3.7);pose.earrings[1]=clamp(pose.earrings[1]+rightVelocity*dt,-.028,.028);
        if(elapsed>=nextBlink){blinkStart=elapsed;nextBlink=elapsed+3+Math.random()*3.3;}
        if(elapsed>=nextSmile){smileUntil=elapsed+2.6;nextSmile=elapsed+11+Math.random()*6;}
        const base=!query.matches&&elapsed<smileUntil?5:0,blink=query.matches?10:elapsed-blinkStart;
        pose.frame=base;pose.nextFrame=base;pose.blend=0;
        if(blink<.07){pose.nextFrame=3;pose.blend=blink/.07;}
        else if(blink<.14){pose.frame=3;pose.nextFrame=4;pose.blend=(blink-.07)/.07;}
        else if(blink<.205){pose.frame=4;pose.nextFrame=3;pose.blend=(blink-.14)/.065;}
        else if(blink<.28){pose.frame=3;pose.nextFrame=base;pose.blend=(blink-.205)/.075;}
        pose.time=query.matches?0:elapsed;
      }
      if(renderer){renderer.draw(pose);}
      else if(rendererFailed){
        const frame=pose.blend>.5?pose.nextFrame:pose.frame;
        setFallbackFrame(previous=>previous===frame?previous:frame);
        canvas.style.setProperty('--fallback-x',`${pose.head[0]*4}px`);canvas.style.setProperty('--fallback-r',`${pose.head[0]*2}deg`);
      }
      // These rendered pose values make the pointer response inspectable in QA.
      if(containerRef.current){containerRef.current.dataset.gaze=`${pose.gaze[0].toFixed(3)},${pose.gaze[1].toFixed(3)}`;containerRef.current.dataset.head=`${pose.head[0].toFixed(3)},${pose.head[1].toFixed(3)}`;containerRef.current.dataset.hair=pose.hair.toFixed(5);containerRef.current.dataset.earrings=pose.earrings.map(n=>n.toFixed(5)).join(',');}
      raf=requestAnimationFrame(update);
    };
    const image=new Image();
    image.onload=()=>{
      if(disposed) return;
      setLoaded(true);
      try{renderer=createPortraitRenderer(canvas,image,character);}catch{renderer=null;}
      rendererFailed=!renderer;setReady(!!renderer);raf=requestAnimationFrame(update);
    };
    image.onerror=()=>{if(!disposed)setFailed(true);};
    image.src=`/assets/${character}-atlas.png`;
    const contextLost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(raf);renderer?.destroy();renderer=null;rendererFailed=true;setReady(false);raf=requestAnimationFrame(update);};
    canvas.addEventListener('webglcontextlost',contextLost);
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',reset);document.documentElement.addEventListener('pointerleave',reset);
    return ()=>{disposed=true;cancelAnimationFrame(raf);renderer?.destroy();window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);document.documentElement.removeEventListener('pointerleave',reset);canvas.removeEventListener('webglcontextlost',contextLost);image.onload=null;image.onerror=null;};
  },[character]);
  const label=character==='tanjiro'?'Tanjiro Kamado: occhi che seguono il cursore, testa, capelli e orecchini animati':'Nezuko Kamado: occhi che seguono il cursore, testa, capelli e fiocco animati';
  return <div ref={containerRef} className={`portrait-rig puppet-rig ${character} ${loaded?'is-loaded':''} ${paused?'still':''}`} data-renderer={ready?'mesh':'fallback'}>
    <div className="portrait-viewport"><canvas ref={canvasRef} className={`portrait-canvas ${ready?'ready':''}`} role="img" aria-label={label}/>{!ready&&<div className="portrait-fallback" style={{'--col':fallbackFrame%3,'--row':Math.floor(fallbackFrame/3)} as React.CSSProperties}><img className="portrait-atlas" src={`/assets/${character}-atlas.png`} alt={label} draggable="false"/></div>}</div>
    {failed&&<p className="asset-error">Il ritratto non è disponibile. Ricarica la pagina per riprovare.</p>}
  </div>;
}
