import { useEffect, useRef, useState, Suspense, lazy, Component } from 'react'
import { ArrowDown, ArrowUpRight, ArrowLeft, ArrowRight, MoveUpRight, Plus, X } from 'lucide-react'
const Atelier = lazy(() => import('./Atelier'))
const clamp = v => Math.min(1, Math.max(0,v))
const projects = [
 {name:'Casa del horizonte',place:'Costa mediterránea',type:'Residencial',year:'2025',number:'01',image:'/images/horizonte.webp',description:'Habitar entre el cielo y la tierra. Una secuencia de terrazas, sombras y jardines que abre cada espacio al paisaje.'},
 {name:'Patio de tierra',place:'Paisaje desértico',type:'Vivienda unifamiliar',year:'2024',number:'02',image:'/images/patio.webp',description:'Muros de tierra, luz y silencio. Un refugio que se organiza alrededor de un patio abierto y un espejo de agua.'},
 {name:'Pabellón del mar',place:'Costa tropical',type:'Pabellón',year:'2025',number:'03',image:'/images/pabellon.webp',description:'Una cubierta ligera, una sombra generosa y el horizonte. Arquitectura que deja al paisaje ser el protagonista.'},
]
class SceneBoundary extends Component {state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="scene-fallback"><span>El primer trazo de algo extraordinario.</span><a href="#proyectos">Explorar proyectos ↗</a></div>:this.props.children}}
export default function App(){
 const story=useRef(null), progress=useRef(0), [p,setP]=useState(0),[selected,setSelected]=useState(0),[detail,setDetail]=useState(false),[reduced,setReduced]=useState(false)
 const touch=useRef(null), closeRef=useRef(null), project=projects[selected]
 useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(m.matches);change();m.addEventListener('change',change);return()=>m.removeEventListener('change',change)},[])
 useEffect(()=>{let raf;const update=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const range=story.current.offsetHeight-innerHeight;const value=clamp(-story.current.getBoundingClientRect().top/range);progress.current=value;setP(value)})};addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();return()=>{removeEventListener('scroll',update);removeEventListener('resize',update);cancelAnimationFrame(raf)}},[])
 useEffect(()=>{if(!detail)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';closeRef.current?.focus();const onKey=e=>{if(e.key==='Escape')setDetail(false);if(e.key==='Tab'){e.preventDefault();closeRef.current?.focus()}};addEventListener('keydown',onKey);return()=>{document.body.style.overflow=old;removeEventListener('keydown',onKey);document.querySelector('.project-info-button')?.focus()}},[detail])
 const go=(id)=>document.getElementById(id)?.scrollIntoView({behavior:reduced?'instant':'smooth'})
 const changeProject=(dir)=>setSelected(i=>(i+dir+projects.length)%projects.length)
 const zoom=clamp((p-.12)/.4), photo=clamp((p-.76)/.16), chapter=p<.28?0:p<.75?1:2
 return <>
  <a className="skip-link" href="#proyectos">Ir a los proyectos</a>
  <header className="site-header"><a href="#inicio" className="wordmark" aria-label="FORMA, inicio">forma<span>®</span></a><span className="brand-caption">ARQUITECTURA<br/>& ESPACIO</span><nav aria-label="Navegación principal"><button onClick={()=>go('inicio')} className={p<.75?'active':''}>El proceso</button><button onClick={()=>go('proyectos')}>Proyectos <span className="nav-count">03</span></button><a className="contact-link" href="#estudio">El estudio <ArrowUpRight size={15}/></a></nav></header>
  <main>
   <section className="story" ref={story} id="inicio" aria-label="Del trazo al espacio: recorrido arquitectónico">
    <div className="story-sticky">
     <div className="grid-paper"/>
     <div className="hero-copy" inert={p>.15} aria-hidden={p>.15} style={{opacity:1-clamp(p/.15),transform:`translateY(${-p*90}px)`,pointerEvents:p>.15?'none':'auto'}}>
      <div className="eyebrow"><span className="tiny-cross">+</span> EL ESPACIO EMPIEZA CON UNA IDEA</div>
      <h1>Del trazo<br/>a la <em>vida.</em></h1>
      <p>Imaginamos espacios.<br/>Diseñamos formas de habitarlos.</p>
      <button className="explore-button" onClick={()=>window.scrollTo({top:innerHeight*.85,behavior:reduced?'instant':'smooth'})}><span className="circle-arrow"><ArrowDown size={19}/></span>Entra al atelier<span className="button-line"/></button>
      <div className="hero-note"><span>01 — 03</span><span>UNA MIRADA AL PROCESO CREATIVO</span></div>
     </div>
     <div className="scene" style={{width:`${70+zoom*30}%`,opacity:1-photo}} aria-label="Escena 3D de un arquitecto hombre dibujando en una mesa con una maqueta que se construye al hacer scroll" role="img"><SceneBoundary><Suspense fallback={<div className="loading-scene"><span className="loader"/>Abriendo el atelier…</div>}><Atelier progress={progress} reduced={reduced} active={p<.94}/></Suspense></SceneBoundary></div>
     <div className="scene-label" style={{opacity:1-clamp(p/.25)}}><span className="label-cross">+</span><span>ATELIER FORMA<br/><small>El lugar donde todo comienza.</small></span><span className="annotation-line"/></div>
     <div className="chapter-copy" style={{opacity:Math.min(clamp((p-.23)/.09),1-clamp((p-.62)/.1))}}><span className="eyebrow">02 / DAR FORMA</span><h2>Una idea.<br/>Infinitas posibilidades.</h2><p>La luz, la materia y el paisaje<br/>encuentran su lugar.</p></div>
     <div className="model-caption" style={{opacity:Math.min(clamp((p-.5)/.1),1-clamp((p-.74)/.08))}}><span>ESTUDIO DE VOLUMEN · 01</span><h3>Casa del horizonte</h3><span>DEL PLANO AL ESPACIO HABITADO</span></div>
     <div className="reveal-photo" style={{opacity:photo,transform:`scale(${1.08-photo*.08})`,visibility:photo>0?'visible':'hidden'}}><img src={projects[0].image} alt="Casa del horizonte, edificio escalonado de piedra clara con jardines y terrazas"/><div className="reveal-shade"/><div className="reveal-copy"><span className="eyebrow">03 / HABITAR LA IDEA</span><h2>Lo imaginado,<br/><em>hecho espacio.</em></h2><button onClick={()=>go('proyectos')}>Descubre los proyectos <ArrowDown size={18}/></button></div><span className="reveal-project">01 — CASA DEL HORIZONTE</span></div>
     <div className={`story-bottom ${photo>.5?'light':''}`}><span className="scroll-instruction"><ArrowDown size={14}/> DESLIZA PARA {p<.7?'DAR VIDA A LA IDEA':'EXPLORAR'}</span><div className="chapter-nav" aria-label="Etapas del recorrido">{['El trazo','La forma','El espacio'].map((t,i)=><button key={t} className={chapter===i?'current':''} onClick={()=>window.scrollTo({top:(story.current.offsetHeight-innerHeight)*[0,.43,.95][i],behavior:reduced?'instant':'smooth'})}><span>0{i+1}</span>{t}</button>)}</div><span className="progress-number">{String(Math.round(p*100)).padStart(2,'0')} / 100</span><div className="progress-track"><i style={{transform:`scaleX(${p})`}}/></div></div>
    </div>
   </section>
   <section id="proyectos" className="projects-section">
    <div className="section-top"><span className="eyebrow">UNA SELECCIÓN DE ESPACIOS</span><span className="eyebrow">PORTFOLIO — 2024 / 2025</span></div>
    <div className="projects-heading"><h2>Ideas que se <em>habitan.</em></h2><span>Proyectos seleccionados <sup>(03)</sup></span></div>
    <div className="project-slider" aria-roledescription="carrusel" aria-label="Proyectos de arquitectura" tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();changeProject(1)}if(e.key==='ArrowLeft'){e.preventDefault();changeProject(-1)}}} onTouchStart={e=>touch.current=e.touches[0].clientX} onTouchEnd={e=>{if(touch.current===null)return;const delta=touch.current-e.changedTouches[0].clientX;if(Math.abs(delta)>45)changeProject(delta>0?1:-1);touch.current=null}}>
     <div className="project-images">{projects.map((item,i)=><img key={item.name} src={item.image} alt={item.description} className={i===selected?'selected':''} loading="lazy" aria-hidden={i!==selected}/>)}<span className="project-image-label">ESTUDIO CONCEPTUAL / {project.number}</span><button className="project-info-button" aria-label={`Ver detalles de ${project.name}`} onClick={()=>setDetail(true)}><Plus size={22}/></button><div className="slider-arrows"><button onClick={()=>changeProject(-1)} aria-label="Proyecto anterior"><ArrowLeft/></button><button onClick={()=>changeProject(1)} aria-label="Proyecto siguiente"><ArrowRight/></button></div></div>
     <div className="project-description" aria-live="polite"><div className="project-name"><span>{project.number} /</span><h3>{project.name}</h3></div><div className="project-meta"><span>{project.place}</span><span>{project.type} · {project.year}</span></div><div className="slider-dots">{projects.map((item,i)=><button key={item.name} className={selected===i?'selected':''} onClick={()=>setSelected(i)} aria-label={`Mostrar ${item.name}`} aria-current={i===selected?'true':undefined}><span/></button>)}</div></div>
    </div>
    <p className="concept-note">Portafolio de muestra · Proyectos conceptuales e imágenes creadas para esta experiencia.</p>
   </section>
   <footer id="estudio"><div><span className="eyebrow">LA MIRADA DE FORMA</span><p>Arquitectura para vivir.<br/><em>Espacios para sentir.</em></p></div><div className="footer-right"><p>Cada proyecto empieza escuchando.<br/>Cada espacio encuentra su propia forma.</p><button onClick={()=>go('inicio')}>Volver al primer trazo <MoveUpRight size={18}/></button></div><div className="footer-bottom"><a href="#inicio" className="wordmark">forma<span>®</span></a><span>ARQUITECTURA & ESPACIO</span><span>© {new Date().getFullYear()} FORMA</span></div></footer>
  </main>
  {detail&&<div className="modal-backdrop" onClick={()=>setDetail(false)}><section role="dialog" aria-modal="true" aria-labelledby="detail-title" className="project-modal" onClick={e=>e.stopPropagation()}><button ref={closeRef} className="modal-close" aria-label="Cerrar detalles" onClick={()=>setDetail(false)}><X/></button><img src={project.image} alt={project.name}/><div><span className="eyebrow">PROYECTO CONCEPTUAL · {project.year}</span><h2 id="detail-title">{project.name}</h2><p>{project.description}</p><span>{project.place} / {project.type}</span></div></section></div>}
 </>
}
