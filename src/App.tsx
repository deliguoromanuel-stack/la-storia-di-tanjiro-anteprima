import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import AnimatedPortrait from './AnimatedPortrait';
import StoryScene from './StoryScene';
import { pageUrl, routePath } from './sitePaths';

const EMAIL='deliguoromanuel@gmail.com';
const chapters=[
 {id:'famiglia',number:'01',label:'La famiglia',title:'Prima di tutto,\nuna casa.',text:'Nel Giappone del periodo Taishō, Tanjiro Kamado vive sulle montagne con sua madre e i suoi fratelli. Dopo la morte del padre, vende carbone in paese per aiutare la famiglia. La neve, il lavoro e i piccoli gesti quotidiani scandiscono una vita semplice, piena di affetto.',emotion:'La serenità, prima del silenzio.',alt:'Tanjiro prepara il carbone con sua madre e Nezuko davanti alla loro casa innevata.'},
 {id:'notte',number:'02',label:'La notte',title:'Una notte\nlontano da casa.',text:'Al termine di una giornata in paese, Tanjiro si prepara a risalire la montagna. È già buio. Saburo gli offre ospitalità e lo avverte: dopo il tramonto, i demoni si aggirano in cerca di esseri umani. Tanjiro resta da lui e riparte soltanto all’alba.',emotion:'Un avvertimento nella notte.',alt:'Saburo offre ospitalità a Tanjiro con una lanterna davanti alla sua casa, nella notte.'},
 {id:'nezuko',number:'03',label:'La trasformazione',title:'Sua sorella.\nAncora.',text:'Quando torna, Tanjiro trova la sua famiglia uccisa da un demone. Solo Nezuko è ancora viva. La prende sulle spalle e corre nella neve in cerca di aiuto, ma durante la discesa lei si trasforma e lo aggredisce. Tanjiro prova a trattenerla: dietro quegli occhi, vuole ritrovare sua sorella.',emotion:'Il dolore diventa una promessa.',alt:'Tanjiro corre nella neve portando Nezuko sulle spalle, tra paura e determinazione.'},
 {id:'promessa',number:'04',label:'La promessa',title:'Un legame\nche resiste.',text:'Giyu Tomioka, un cacciatore di demoni, interviene per uccidere Nezuko. Tanjiro tenta di proteggerla, ma viene messo fuori combattimento. È allora che Nezuko difende il fratello, invece di divorarlo. Giyu la risparmia e indica ai due la strada verso Sakonji Urokodaki, sul monte Sagiri. Dopo aver seppellito la famiglia, i fratelli partono insieme.',emotion:'La speranza ha due nomi.',alt:'Nezuko protegge Tanjiro nella neve, mentre Giyu osserva sorpreso e abbassa la spada.'},
];
function useReducedMotion(){const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(q.matches);q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[]);return reduced;}
type Navigate=(path:string,origin?:[number,number])=>void;
function RouteLink({href,navigate,children,className}:{href:string;navigate:Navigate;children:ReactNode;className?:string}){return <a href={pageUrl(href)} className={className} onClick={(e:MouseEvent<HTMLAnchorElement>)=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();const box=e.currentTarget.getBoundingClientRect();navigate(href,[box.left+box.width/2,box.top+box.height/2]);}}>{children}</a>;}
function MotionControl({paused,toggle}:{paused:boolean;toggle:()=>void}){return <button className="motion-control" onClick={toggle} aria-pressed={paused} aria-label={paused?'Riprendi animazione':'Metti in pausa animazione'} title={paused?'Riprendi animazione':'Pausa animazione'}><span aria-hidden="true">{paused?'▶':'Ⅱ'}</span></button>;}

export default function App(){
 const [path,setPath]=useState(routePath),[paused,setPaused]=useState(false),[active,setActive]=useState(0),[terms,setTerms]=useState(false);
 const [cookieOpen,setCookieOpen]=useState(()=>{try{return !document.cookie.split('; ').some(c=>c.startsWith('ds_cookie_notice=v1'));}catch{return true;}});
 const [thought,setThought]=useState<{phase:'enter'|'leave';variant:number;origin:[number,number]}|null>(null);
 const [chapterThought,setChapterThought]=useState<{variant:number;serial:number}|null>(null);
 const chapterTimer=useRef<ReturnType<typeof setTimeout>|null>(null),lastChapter=useRef<number|null>(null),dreamSerial=useRef(0);
 const thoughtBusy=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]),dialogRef=useRef<HTMLDialogElement>(null),headingRef=useRef<HTMLHeadingElement>(null);
 const reduced=useReducedMotion(),story=path==='/storia'||path==='/storia/';
 const toggle=()=>setPaused(p=>!p);
 const navigate=useCallback<Navigate>((next,origin)=>{
  if(thoughtBusy.current||routePath()===next)return;
  thoughtBusy.current=true;setThought({phase:'enter',variant:Math.floor(Math.random()*3),origin:origin??[innerWidth/2,innerHeight/2]});
  const covered=reduced?440:750;
  timers.current.push(setTimeout(()=>{history.pushState({},'',pageUrl(next));setPath(next);window.scrollTo({top:0,behavior:'instant'});setThought(t=>t?{...t,phase:'leave'}:null);},covered));
  timers.current.push(setTimeout(()=>{setThought(null);thoughtBusy.current=false;},covered+(reduced?600:1100)));
 },[reduced]);
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 useEffect(()=>{const pop=()=>{timers.current.forEach(clearTimeout);thoughtBusy.current=false;setThought(null);setPath(routePath());};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
 useEffect(()=>{document.title=story?'Demon Slayer — Il primo ricordo':'Demon Slayer — Tanjiro & Nezuko';requestAnimationFrame(()=>headingRef.current?.focus({preventScroll:true}));},[story]);
 useEffect(()=>{if(terms&&!dialogRef.current?.open)dialogRef.current?.showModal();if(!terms&&dialogRef.current?.open)dialogRef.current.close();},[terms]);
 useEffect(()=>{
  if(!story)return;
  const reveal=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');reveal.unobserve(entry.target);}});},{threshold:.08,rootMargin:'0px 0px -4% 0px'});
  lastChapter.current=null;
  let observer:IntersectionObserver|undefined;
  const observeChapters=()=>{observer?.disconnect();const margin=Math.round(innerHeight*.48);observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const next=Number((entry.target as HTMLElement).dataset.chapter);setActive(next);if(lastChapter.current!==null&&lastChapter.current!==next){if(chapterTimer.current)clearTimeout(chapterTimer.current);setChapterThought({variant:Math.floor(Math.random()*3),serial:++dreamSerial.current});chapterTimer.current=setTimeout(()=>setChapterThought(null),reduced?650:1250);}lastChapter.current=next;});},{rootMargin:`-${margin}px 0px -${margin}px 0px`});document.querySelectorAll('[data-chapter]').forEach(el=>observer?.observe(el));};
  document.querySelectorAll('[data-reveal]').forEach(el=>reveal.observe(el));observeChapters();window.addEventListener('resize',observeChapters);
  return()=>{reveal.disconnect();observer?.disconnect();window.removeEventListener('resize',observeChapters);if(chapterTimer.current)clearTimeout(chapterTimer.current);setChapterThought(null);};
 },[story,reduced]);
 const jumpChapter=(index:number)=>document.getElementById(chapters[index].id)?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
 const dismissCookie=()=>{try{document.cookie=`ds_cookie_notice=v1; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}catch{}setCookieOpen(false);};
 const footer=<footer className="legal-footer"><button onClick={()=>setTerms(true)}>Termini e condizioni</button><span>© {new Date().getFullYear()} · Omaggio non ufficiale a Demon Slayer</span><a href={`mailto:${EMAIL}`}>{EMAIL}</a></footer>;
 return <div className={`site ${story?'story-site':'home-site'} ${thought?.phase==='enter'?'thinking':''}`}>
  <a className="skip-link" href={story?'#racconto':'#home-content'}>Vai al contenuto</a>
  <header className={`site-header ${story?'compact':''}`}><RouteLink href="/" navigate={navigate} className="site-logo">{!story?<h1 ref={headingRef} tabIndex={-1}>DEMON SLAYER</h1>:<span>DEMON SLAYER</span>}</RouteLink></header>
  <div className="page-world">
  {!story?<main className="home-hero" id="home-content"><div className="hero-atmosphere" aria-hidden="true"/><div className="hero-orbit" aria-hidden="true"/><div className="character-stage"><AnimatedPortrait character="tanjiro" paused={paused}/></div><div className="hero-call"><RouteLink href="/storia" navigate={navigate} className="thought-button"><span className="button-orb" aria-hidden="true"/><span>Scopri la storia</span><span className="button-glow" aria-hidden="true"/></RouteLink></div><div className="hero-motion"><MotionControl paused={paused} toggle={toggle}/></div>{footer}</main>:<main id="racconto">
   <div className={`snowfield ${paused?'paused':''}`} aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{'--left':`${(i*37)%100}%`,'--delay':`${-i*.67}s`,'--duration':`${8+i%7}s`,'--size':`${2+i%3}px`} as CSSProperties}/>)}</div>
   <section className="story-hero"><div className="story-intro"><p className="eyebrow">IL PRIMO RICORDO / EPISODIO 01</p><h1 ref={headingRef} tabIndex={-1}>La notte<br/>che cambiò<br/><em>ogni cosa.</em></h1><p>Prima della spada. Prima del viaggio.<br/>Un fratello, una sorella e una promessa.</p><button className="read-button" onClick={()=>jumpChapter(0)}>Entra nel ricordo <span>01 — 04</span></button><span className="spoiler-note">Il racconto contiene gli eventi del primo episodio.</span></div><div className="nezuko-stage"><AnimatedPortrait character="nezuko" paused={paused}/></div><div className="story-motion"><MotionControl paused={paused} toggle={toggle}/></div></section>
   <nav className="chapter-nav" aria-label="Capitoli">{chapters.map((chapter,index)=><button key={chapter.id} className={active===index?'active':''} onClick={()=>jumpChapter(index)} aria-current={active===index?'step':undefined}><span>{chapter.number}</span>{chapter.label}</button>)}<MotionControl paused={paused} toggle={toggle}/></nav>
   <div className="chapters">{chapters.map((chapter,index)=><section className={`chapter chapter-${index+1}`} id={chapter.id} data-chapter={index} key={chapter.id}>
    <figure className="chapter-scene" data-reveal><StoryScene chapter={index+1} paused={paused} alt={chapter.alt}/><figcaption><span>{chapter.number}</span>{chapter.label}</figcaption></figure>
    <div className="chapter-copy" data-reveal><span className="eyebrow">RICORDO {chapter.number} / 04</span><h2>{chapter.title.split('\n').map((line,i)=><span key={i}>{line}<br/></span>)}</h2><p>{chapter.text}</p><span className="chapter-emotion">{chapter.emotion}</span></div>
   </section>)}</div>
   <section className="story-ending" data-reveal><p className="eyebrow">QUESTO È SOLTANTO L’INIZIO.</p><h2>La speranza ha<br/>due nomi.</h2><span>Tanjiro & Nezuko</span><RouteLink href="/" navigate={navigate} className="thought-button"><span className="button-orb" aria-hidden="true"/>Torna da Tanjiro</RouteLink></section>{footer}
  </main>}
  </div>
  {thought&&<div className={`thought-portal thought-${thought.variant} ${thought.phase} ${reduced?'gentle':''}`} style={{'--origin-x':`${thought.origin[0]}px`,'--origin-y':`${thought.origin[1]}px`} as CSSProperties} aria-hidden="true"><div className="thought-mist"/><div className="thought-ring ring-one"/><div className="thought-ring ring-two"/><div className="thought-ring ring-three"/><div className="thought-core"/></div>}
  {chapterThought&&<div key={chapterThought.serial} className={`thought-portal chapter-dream thought-${chapterThought.variant} ${reduced?'gentle':''}`} style={{'--origin-x':'50vw','--origin-y':'45vh'} as CSSProperties} aria-hidden="true"><div className="thought-mist"/><div className="thought-ring ring-one"/><div className="thought-ring ring-two"/></div>}
  <span className="sr-only" role="status">{thought?'Si apre un ricordo.':''}</span>
  {cookieOpen&&<aside className="cookie-notice" aria-label="Informativa cookie"><div><strong>Un piccolo promemoria.</strong><p>Questo sito usa un cookie tecnico per ricordare la chiusura di questo avviso. Nessun tracciamento pubblicitario aggiunto dal sito. <button onClick={()=>setTerms(true)}>Leggi i dettagli</button></p></div><button className="cookie-dismiss" onClick={dismissCookie}>Ho capito</button></aside>}
  <dialog ref={dialogRef} className="terms-dialog" onCancel={()=>setTerms(false)} onClick={e=>{if(e.target===e.currentTarget)setTerms(false);}}><button className="dialog-close" aria-label="Chiudi termini e condizioni" onClick={()=>setTerms(false)}>×</button><h2>Termini e condizioni</h2><p>Questa è un’esperienza creativa non ufficiale dedicata a Demon Slayer. Personaggi, nomi e opera appartengono ai rispettivi titolari. Il sito presenta illustrazioni originali e un riassunto degli eventi del primo episodio.</p><h3>Uso del sito</h3><p>I contenuti sono offerti per consultazione personale. Il sito non vende prodotti, non raccoglie pagamenti e non è affiliato ai titolari dell’opera.</p><h3>Cookie e privacy</h3><p>Il cookie tecnico <code>ds_cookie_notice</code> conserva per un anno la chiusura dell’avviso. Puoi rimuoverlo dalle impostazioni del browser. Il sito non aggiunge cookie pubblicitari o strumenti di analisi. Il servizio di hosting può gestire dati e cookie necessari all’accesso e alla sicurezza secondo la propria informativa.</p><p>Per contatti o segnalazioni: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p><a className="reference-link" href="https://www.garanteprivacy.it/faq/Cookie" target="_blank" rel="noreferrer">Informazioni sui cookie · Garante Privacy</a></dialog>
 </div>;
}
