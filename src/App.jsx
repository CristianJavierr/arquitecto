import { useCallback, useEffect, useRef, useState, Suspense, lazy, Component } from 'react'
import { ArrowDown, ArrowUpRight, ArrowLeft, ArrowRight, MoveUpRight, Plus, X } from 'lucide-react'
import { clamp, ease, stops, chapters } from './journey'
const Atelier = lazy(() => import('./Atelier'))
const projects = [
 {name:'Casa del horizonte',place:'Costa mediterránea',type:'Residencial',year:'2025',number:'01',image:'/images/horizonte.webp',description:'Habitar entre el cielo y la tierra. Una secuencia de terrazas, sombras y jardines que abre cada espacio al paisaje.'},
 {name:'Patio de tierra',place:'Paisaje desértico',type:'Vivienda unifamiliar',year:'2024',number:'02',image:'/images/patio.webp',description:'Muros de tierra, luz y silencio. Un refugio que se organiza alrededor de un patio abierto y un espejo de agua.'},
 {name:'Pabellón del mar',place:'Costa tropical',type:'Pabellón',year:'2025',number:'03',image:'/images/pabellon.webp',description:'Una cubierta ligera, una sombra generosa y el horizonte. Arquitectura que deja al paisaje ser el protagonista.'},
]
class SceneBoundary extends Component {state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="scene-fallback"><span>El primer trazo de algo extraordinario.</span><a href="#proyectos">Explorar proyectos ↗</a></div>:this.props.children}}
export default function App(){
 const story=useRef(null), stage=useRef(null), progress=useRef(0), percent=useRef(null)
 const [chapter,setChapter]=useState(0),[gallery,setGallery]=useState(false),[capture,setCapture]=useState(null),[selected,setSelected]=useState(0),[detail,setDetail]=useState(false),[reduced,setReduced]=useState(false)
 const touch=useRef(null), closeRef=useRef(null), project=projects[selected]
 useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(m.matches);change();m.addEventListener('change',change);return()=>m.removeEventListener('change',change)},[])
 // Scroll events only update a target. A single time-based animation clock drives
 // CSS and WebGL together, with no React rendering or canvas resizing per frame.
 useEffect(()=>{
  let raf=0, previous=performance.now(), target=0, range=1, origin=0, lastChapter=-1, wasGallery=false, lastPercent=-1
  const measure=()=>{range=Math.max(1,story.current.offsetHeight-innerHeight);origin=story.current.getBoundingClientRect().top+scrollY;onScroll()}
  const paint=()=>{
   const p=progress.current, photo=ease(.79,.92,p), ui=ease(.90,.96,p)
   const s=stage.current.style
   s.setProperty('--hero-opacity',1-ease(.025,.13,p));s.setProperty('--hero-y',`${-ease(.025,.13,p)*32}px`)
   s.setProperty('--plan-opacity',ease(.13,.20,p)*(1-ease(.39,.44,p)))
   s.setProperty('--form-opacity',ease(.44,.49,p)*(1-ease(.65,.71,p)))
   s.setProperty('--model-opacity',ease(.69,.74,p)*(1-ease(.80,.85,p)))
   s.setProperty('--photo-opacity',photo);s.setProperty('--photo-scale',1)
   s.setProperty('--photo-inset','0%');s.setProperty('--scene-opacity',1-ease(.84,.93,p))
   s.setProperty('--gallery-ui',ui);s.setProperty('--progress',p);s.setProperty('--paper-opacity',1-ease(.72,.88,p))
   const next=p<.15?0:p<.43?1:p<.79?2:3
   if(next!==lastChapter){lastChapter=next;setChapter(next)}
   const available=p>.925
   if(available!==wasGallery){wasGallery=available;setGallery(available)}
   const value=Math.round(p*100);if(value!==lastPercent){lastPercent=value;percent.current.textContent=String(value).padStart(2,'0')+' / 100'}
  }
  const tick=now=>{const dt=Math.min((now-previous)/1000,.05);previous=now;progress.current=reduced?target:progress.current+(target-progress.current)*(1-Math.exp(-8*dt));if(Math.abs(target-progress.current)<.000015)progress.current=target;paint();if(progress.current!==target)raf=requestAnimationFrame(tick);else raf=0}
  function onScroll(){target=clamp((scrollY-origin)/range);if(!raf){previous=performance.now();raf=requestAnimationFrame(tick)}}
  measure();addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',measure)
  return()=>{cancelAnimationFrame(raf);removeEventListener('scroll',onScroll);removeEventListener('resize',measure)}
 },[reduced])
 const goTo=useCallback(value=>{const el=story.current;window.scrollTo({top:el.offsetTop+(el.offsetHeight-innerHeight)*value,behavior:reduced?'instant':'smooth'})},[reduced])
 const changeProject=useCallback(dir=>setSelected(i=>(i+dir+projects.length)%projects.length),[])
 useEffect(()=>{if(!gallery)setSelected(0)},[gallery])
 useEffect(()=>{const resize=()=>setCapture(null);addEventListener('resize',resize);return()=>removeEventListener('resize',resize)},[])
 useEffect(()=>{if(!detail)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';closeRef.current?.focus();const onKey=e=>{if(e.key==='Escape')setDetail(false);if(e.key==='Tab'){e.preventDefault();closeRef.current?.focus()}};addEventListener('keydown',onKey);return()=>{document.body.style.overflow=old;removeEventListener('keydown',onKey);document.querySelector('.project-info-button')?.focus()}},[detail])
 return <>
  <a className="skip-link" href="#proyectos" onClick={e=>{e.preventDefault();goTo(.97)}}>Ir a los proyectos</a>
  <header className="site-header"><a href="#inicio" className="wordmark" aria-label="FORMA, inicio" onClick={e=>{e.preventDefault();goTo(0)}}>forma<span>®</span></a><span className="brand-caption">ARQUITECTURA<br/>& ESPACIO</span><nav aria-label="Navegación principal"><button onClick={()=>goTo(0)} className="active">El proceso</button><button onClick={()=>goTo(.97)}>Proyectos <span className="nav-count">03</span></button><a className="contact-link" href="#estudio">El estudio <ArrowUpRight size={15}/></a></nav></header>
  <main>
   <section className="story" ref={story} id="inicio" aria-label="Del trazo al espacio: recorrido arquitectónico">
    <span id="proyectos" className="projects-anchor"/>
    <div className={`story-sticky ${gallery?'gallery-active':''}`} ref={stage}>
     <div className="grid-paper"/>
     <div className="hero-copy" inert={chapter!==0} aria-hidden={chapter!==0}>
      <div className="eyebrow"><span className="tiny-cross">+</span> EL ESPACIO EMPIEZA CON UNA IDEA</div>
      <h1>Del trazo<br/>a la <em>vida.</em></h1>
      <p>Imaginamos espacios.<br/>Diseñamos formas de habitarlos.</p>
      <button className="explore-button" onClick={()=>goTo(.18)}><span className="circle-arrow"><ArrowDown size={19}/></span>Entra al atelier<span className="button-line"/></button>
      <div className="hero-note"><span>01 — 04</span><span>UNA MIRADA AL PROCESO CREATIVO</span></div>
     </div>
     <div className="scene" aria-label="Arquitecto dibujando: los trazos completan un plano 2D y el edificio se levanta desde el papel" role="img"><SceneBoundary><Suspense fallback={<div className="loading-scene"><span className="loader"/>Abriendo el atelier…</div>}><Atelier progress={progress} reduced={reduced} active={!gallery||!capture} onCapture={setCapture}/></Suspense></SceneBoundary></div>
     <div className="scene-label"><span className="label-cross">+</span><span>ATELIER FORMA<br/><small>El lugar donde todo comienza.</small></span><span className="annotation-line"/></div>
     <div className="chapter-copy plan-copy" aria-hidden={chapter!==1}><span className="eyebrow">02 / EL PLANO</span><h2>Primero,<br/><em>cada trazo.</em></h2><p>La idea encuentra sus líneas.<br/>Nada se levanta antes de imaginarlo.</p><span className="drawing-caption">PLANTA ARQUITECTÓNICA · ESC. 1:100</span></div>
     <div className="chapter-copy form-copy" aria-hidden={chapter!==2}><span className="eyebrow">03 / DAR FORMA</span><h2>Del papel<br/><em>al espacio.</em></h2><p>Las líneas se levantan.<br/>La luz encuentra su lugar.</p></div>
     <div className="model-caption"><span>DE LA MAQUETA A LA MATERIA</span><h3>Casa del horizonte</h3><span>UNA IDEA QUE EMPIEZA A HABITARSE</span></div>
     <div className="immersive-gallery" aria-roledescription="carrusel" aria-label="Proyectos de arquitectura" aria-hidden={!gallery} inert={!gallery} tabIndex={gallery?0:-1} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();changeProject(1)}if(e.key==='ArrowLeft'){e.preventDefault();changeProject(-1)}}} onTouchStart={e=>{touch.current=[e.touches[0].clientX,e.touches[0].clientY]}} onTouchEnd={e=>{if(!touch.current)return;const dx=touch.current[0]-e.changedTouches[0].clientX,dy=touch.current[1]-e.changedTouches[0].clientY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)changeProject(dx>0?1:-1);touch.current=null}}>
      <div className="gallery-photos">{projects.map((item,i)=><img key={item.name} src={i===0?(capture||item.image):item.image} alt={item.description} className={`${i===selected?'selected':''} ${i===0?'model-image':''}`} fetchPriority={i===0?'high':'auto'} aria-hidden={i!==selected}/>)}</div>
      <div className="gallery-shade"/>
      <div className="gallery-top gallery-ui"><span className="eyebrow">04 / EL ESPACIO HABITADO</span><span className="gallery-concept">PORTFOLIO CONCEPTUAL</span></div>
      <div className="gallery-info gallery-ui" aria-live="polite"><span className="eyebrow">{project.type} · {project.year}</span><h2>{project.name}</h2><p>{project.place}</p><button className="project-info-button" onClick={()=>setDetail(true)} aria-label={`Ver detalles de ${project.name}`}>Descubrir el proyecto <Plus size={18}/></button></div>
      <div className="gallery-controls gallery-ui"><div className="gallery-pagination"><span>{project.number}</span><i/><span>03</span></div><div className="slider-arrows"><button onClick={()=>changeProject(-1)} aria-label="Proyecto anterior"><ArrowLeft/></button><button onClick={()=>changeProject(1)} aria-label="Proyecto siguiente"><ArrowRight/></button></div><div className="slider-dots">{projects.map((item,i)=><button key={item.name} className={selected===i?'selected':''} onClick={()=>setSelected(i)} aria-label={`Mostrar ${item.name}`} aria-current={i===selected?'true':undefined}><span/></button>)}</div></div>
     </div>
     <div className={`story-bottom ${chapter===3?'light':''}`}><span className="scroll-instruction"><ArrowDown size={14}/> {gallery?'EXPLORA LOS PROYECTOS':'DESLIZA PARA DAR VIDA A LA IDEA'}</span><div className="chapter-nav" aria-label="Etapas del recorrido">{chapters.map((t,i)=><button key={t} className={chapter===i?'current':''} onClick={()=>goTo(stops[i])}><span>0{i+1}</span>{t}</button>)}</div><span ref={percent} className="progress-number">00 / 100</span><div className="progress-track"><i/></div></div>
    </div>
   </section>
   <footer id="estudio"><div><span className="eyebrow">LA MIRADA DE FORMA</span><p>Arquitectura para vivir.<br/><em>Espacios para sentir.</em></p></div><div className="footer-right"><p>Cada proyecto empieza escuchando.<br/>Cada espacio encuentra su propia forma.</p><button onClick={()=>goTo(0)}>Volver al primer trazo <MoveUpRight size={18}/></button></div><div className="footer-bottom"><a href="#inicio" className="wordmark">forma<span>®</span></a><span>ARQUITECTURA & ESPACIO</span><span>© {new Date().getFullYear()} FORMA</span></div></footer>
  </main>
  {detail&&<div className="modal-backdrop" onClick={()=>setDetail(false)}><section role="dialog" aria-modal="true" aria-labelledby="detail-title" className="project-modal" onClick={e=>e.stopPropagation()}><button ref={closeRef} className="modal-close" aria-label="Cerrar detalles" onClick={()=>setDetail(false)}><X/></button><img src={selected===0?(capture||project.image):project.image} alt={project.name}/><div><span className="eyebrow">PROYECTO CONCEPTUAL · {project.year}</span><h2 id="detail-title">{project.name}</h2><p>{project.description}</p><span>{project.place} / {project.type}</span></div></section></div>}
 </>
}
