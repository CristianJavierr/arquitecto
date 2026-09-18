import { useCallback, useEffect, useRef, useState, Suspense, lazy, Component } from 'react'
import { ArrowUpRight, MoveUpRight } from 'lucide-react'
import { MaskedLiftText } from './reactdrops/masked-lift'
import { clamp, ease, stops, chapters } from './journey'
const Atelier = lazy(() => import('./Atelier'))
const projects = [
 {name:'Casa del horizonte',place:'Costa mediterránea',type:'Residencial',year:'2025',number:'01',image:'https://images.unsplash.com/photo-1619509800519-dd8010775e07?auto=format&fit=crop&w=1400&q=85',description:'Habitar entre el cielo y la tierra. Una secuencia de terrazas, sombras y jardines que abre cada espacio al paisaje.'},
 {name:'Patio de tierra',place:'Paisaje desértico',type:'Vivienda unifamiliar',year:'2024',number:'02',image:'https://images.unsplash.com/photo-1617794791213-998689856366?auto=format&fit=crop&w=1400&q=85',description:'Muros de tierra, luz y silencio. Un refugio que se organiza alrededor de un patio abierto y un espejo de agua.'},
 {name:'Pabellón del mar',place:'Costa tropical',type:'Pabellón',year:'2025',number:'03',image:'https://images.unsplash.com/photo-1755742424053-ff9ce9c2a2bb?auto=format&fit=crop&w=1400&q=85',description:'Una cubierta ligera, una sombra generosa y el horizonte. Arquitectura que deja al paisaje ser el protagonista.'},
]
function waitForImage(src){return new Promise(resolve=>{const image=new Image();let settled=false;const done=()=>{if(settled)return;settled=true;resolve()};image.onload=()=>{const decoded=image.decode?.();decoded?decoded.catch(()=>{}).then(done):done()};image.onerror=done;image.src=src;if(image.complete)image.onload()})}
function SceneReady({onReady}){useEffect(()=>{onReady()},[onReady]);return null}
function PageLoader({visible}){return <div className={`page-loader ${visible?'is-visible':'is-done'}`} aria-hidden={!visible}><div className="page-loader-inner"><span className="page-loader-mark">forma<span>®</span></span><span className="page-loader-label">PREPARANDO EL ESTUDIO</span><span className="page-loader-track"><i/></span></div></div>}
class SceneBoundary extends Component {state={failed:false};static getDerivedStateFromError(){return {failed:true}}componentDidCatch(){this.props.onError?.()}render(){return this.state.failed?<div className="scene-fallback"><span>El primer trazo de algo extraordinario.</span><a href="#inicio">Volver al inicio ↗</a></div>:this.props.children}}
export default function App(){
 const story=useRef(null), stage=useRef(null), progress=useRef(0), percent=useRef(null)
 const [chapter,setChapter]=useState(0),[reduced,setReduced]=useState(false),[sceneReady,setSceneReady]=useState(false),[assetsReady,setAssetsReady]=useState(false),[pageReady,setPageReady]=useState(false)
 const handleSceneReady=useCallback(()=>setSceneReady(true),[]),handleSceneError=useCallback(()=>setSceneReady(true),[])
 useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(m.matches);change();m.addEventListener('change',change);return()=>m.removeEventListener('change',change)},[])
 useEffect(()=>{let cancelled=false;const assets=Promise.all([document.fonts?.ready??Promise.resolve(),...['/images/juan-nadal.jpg',...projects.map(item=>item.image)].map(waitForImage)]);const minimum=new Promise(resolve=>setTimeout(resolve,850));Promise.all([assets,minimum]).then(()=>{if(!cancelled)setAssetsReady(true)});return()=>{cancelled=true}},[])
 useEffect(()=>{if(!sceneReady||!assetsReady)return;const frame=requestAnimationFrame(()=>setPageReady(true));return()=>cancelAnimationFrame(frame)},[sceneReady,assetsReady])
 useEffect(()=>{document.documentElement.classList.toggle('is-page-loading',!pageReady);return()=>document.documentElement.classList.remove('is-page-loading')},[pageReady])
 // Scroll events only update a target. A single time-based animation clock drives
 // CSS and WebGL together, with no React rendering or canvas resizing per frame.
 useEffect(()=>{
  let raf=0, previous=performance.now(), target=0, range=1, origin=0, lastChapter=-1, lastPercent=-1
  const measure=()=>{range=Math.max(1,story.current.offsetHeight-innerHeight);origin=story.current.getBoundingClientRect().top+scrollY;onScroll()}
  const paint=()=>{
   const p=progress.current
   const planReveal=ease(.13,.20,p), planExit=ease(.39,.44,p)
   const formReveal=ease(.44,.49,p), formExit=ease(.65,.71,p)
   const modelReveal=ease(.80,.90,p)
   const s=stage.current.style
   s.setProperty('--hero-opacity',1-ease(.025,.13,p));s.setProperty('--hero-y',`${-ease(.025,.13,p)*32}px`)
   s.setProperty('--plan-opacity',planReveal*(1-planExit));s.setProperty('--plan-lift',`${(reduced?0:(1-planReveal)*105-planExit*18)}%`)
   s.setProperty('--form-opacity',formReveal*(1-formExit));s.setProperty('--form-lift',`${(reduced?0:(1-formReveal)*105-formExit*18)}%`)
   s.setProperty('--model-opacity',modelReveal);s.setProperty('--model-lift',`${(reduced?0:(1-modelReveal)*105)}%`)
   s.setProperty('--scene-opacity',1);s.setProperty('--progress',p);s.setProperty('--paper-opacity',1)
   const next=p<.15?0:p<.43?1:p<.90?2:3
   if(next!==lastChapter){lastChapter=next;setChapter(next)}
   const value=Math.round(p*100);if(value!==lastPercent){lastPercent=value;percent.current.textContent=String(value).padStart(2,'0')+' / 100'}
  }
  const tick=now=>{const dt=Math.min((now-previous)/1000,.05);previous=now;progress.current=reduced?target:progress.current+(target-progress.current)*(1-Math.exp(-8*dt));if(Math.abs(target-progress.current)<.000015)progress.current=target;paint();if(progress.current!==target)raf=requestAnimationFrame(tick);else raf=0}
  function onScroll(){target=clamp((scrollY-origin)/range);if(!raf){previous=performance.now();raf=requestAnimationFrame(tick)}}
  measure();addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',measure)
  return()=>{cancelAnimationFrame(raf);removeEventListener('scroll',onScroll);removeEventListener('resize',measure)}
 },[reduced])
 const goTo=useCallback(value=>{const el=story.current;window.scrollTo({top:el.offsetTop+(el.offsetHeight-innerHeight)*value,behavior:reduced?'instant':'smooth'})},[reduced])
 return <div className={`site-shell ${pageReady?'page-ready':'page-loading'}`}>
  <PageLoader visible={!pageReady}/>
  <header className="site-header"><a href="#inicio" className="wordmark" aria-label="FORMA, inicio" onClick={e=>{e.preventDefault();goTo(0)}}>forma<span>®</span></a><span className="brand-caption">ARQUITECTURA<br/>& ESPACIO</span><nav aria-label="Navegación principal"><button onClick={()=>goTo(0)} className="active">El proceso</button><a className="architect-link" href="#arquitecto">El arquitecto</a><a className="contact-link" href="#contacto">Contacto <ArrowUpRight size={15}/></a></nav></header>
  <main>
   <section className="story" ref={story} id="inicio" aria-label="Del trazo al espacio: recorrido arquitectónico">
    <div className="story-sticky" ref={stage}>
     <div className="grid-paper"/>
     <div className="hero-copy" inert={chapter!==0} aria-hidden={chapter!==0}>
      <MaskedLiftText as="h1" className="hero-title-reveal" trigger="auto" delay={.12} duration={1.05} stagger={.1}>Del trazo<br/>a la vida.</MaskedLiftText>
      <MaskedLiftText as="p" className="hero-copy-reveal" trigger="auto" delay={.38} duration={.9} stagger={.1}>Imaginamos espacios.<br/>Diseñamos formas de habitarlos.</MaskedLiftText>
     </div>
     <div className="scene" aria-label="Atelier de arquitectura: el plano 2D se completa y una casa moderna se ensambla en seis bloques" role="img"><SceneBoundary onError={handleSceneError}><Suspense fallback={<div className="loading-scene"><span className="loader"/>Abriendo el atelier…</div>}><Atelier progress={progress} reduced={reduced} active/><SceneReady onReady={handleSceneReady}/></Suspense></SceneBoundary></div>
     <div className="chapter-copy plan-copy" aria-hidden={chapter!==1}><div className="chapter-card-inner"><span className="eyebrow">02 / EL PLANO</span><h2>Primero,<br/><em>cada trazo.</em></h2><p>Cada línea se convierte en un lienzo de infinitas posibilidades.<br/>Así comienza la estructura de tus sueños.</p></div></div>
     <div className="chapter-copy form-copy" aria-hidden={chapter!==2}><div className="chapter-card-inner"><span className="eyebrow">03 / DAR FORMA</span><h2>Del papel<br/><em>al espacio.</em></h2><p>Cada volumen encuentra su lugar.<br/>Y al final, tu casa, edificio o apartamento se vuelve realidad.</p></div></div>
     <div className="model-caption"><div className="chapter-card-inner"><span>DE LA MAQUETA A LA MATERIA</span><h3>Casa Umbral</h3><span>UNA IDEA QUE EMPIEZA A HABITARSE</span></div></div>
     <div className={`story-bottom ${chapter===3?'light':''}`}><div className="chapter-nav" aria-label="Etapas del recorrido">{chapters.map((t,i)=><button key={t} className={chapter===i?'current':''} onClick={()=>goTo(stops[i])}><span>0{i+1}</span>{t}</button>)}</div><span ref={percent} className="progress-number">00 / 100</span><div className="progress-track"><i/></div></div>
   </div>
   </section>
   <section className="architect-section" id="arquitecto" aria-labelledby="architect-title">
    <div className="architect-intro">
     <div className="architect-photo"><img src="/images/juan-nadal.jpg" alt="Arq. Juan Nadal en su estudio"/><span className="architect-photo-label">ARQ. JUAN NADAL / EL ESTUDIO</span></div>
     <div className="architect-copy"><span className="eyebrow">EL ARQUITECTO</span><MaskedLiftText as="h2" id="architect-title" trigger="scroll" delay={.08} duration={1.05} stagger={.1}>Juan Nadal.</MaskedLiftText><MaskedLiftText as="p" trigger="scroll" delay={.2} duration={.95} stagger={.08}>Arq. Juan Nadal trabaja entre la precisión del plano y la vida cotidiana. Su arquitectura empieza observando cómo entra la luz, cómo se recorre una habitación y qué lugar termina haciendo suyo cada persona.</MaskedLiftText><MaskedLiftText as="p" className="architect-note" trigger="scroll" delay={.32} duration={.85} stagger={.08}>Una práctica independiente de arquitectura, paisaje e interiores.</MaskedLiftText><div className="architect-facts"><span>FORMA / 2011</span><span>SANTO DOMINGO · MADRID</span></div></div>
    </div>
    <section className="project-slider" id="proyectos" aria-labelledby="projects-title">
     <div className="project-slider-heading"><div><MaskedLiftText as="span" className="eyebrow" trigger="scroll" delay={.05} duration={.8} stagger={.08}>PROYECTOS SELECCIONADOS</MaskedLiftText><MaskedLiftText as="h2" id="projects-title" trigger="scroll" delay={.14} duration={1} stagger={.1}>Una obra en proceso.</MaskedLiftText></div><MaskedLiftText as="span" className="project-slider-count" trigger="scroll" delay={.24} duration={.8} stagger={.08}>03 PROYECTOS</MaskedLiftText></div>
     <div className="project-card-grid">
      {projects.map((item,index)=><article className="project-card" key={item.name}><div className="project-card-media"><img src={item.image} alt={item.description}/><MaskedLiftText as="span" className="project-card-number" trigger="scroll" delay={.08+index*.06} duration={.72} stagger={.06}>{item.number}</MaskedLiftText></div><div className="project-card-copy"><div className="project-card-title"><MaskedLiftText as="h3" trigger="scroll" delay={.16+index*.06} duration={.9} stagger={.08}>{item.name}</MaskedLiftText><MaskedLiftText as="span" trigger="scroll" delay={.25+index*.06} duration={.8} stagger={.06}>{item.type} · {item.year}</MaskedLiftText></div><MaskedLiftText as="p" trigger="scroll" delay={.33+index*.06} duration={.9} stagger={.08}>{item.description}</MaskedLiftText><MaskedLiftText as="small" trigger="scroll" delay={.43+index*.06} duration={.75} stagger={.06}>{item.place}</MaskedLiftText></div></article>)}
     </div>
    </section>
   </section>
   <section className="contact-section" id="contacto" aria-labelledby="contact-title">
    <div className="contact-heading"><span className="eyebrow">CONTACTO</span><MaskedLiftText as="h2" id="contact-title" trigger="scroll" delay={.08} duration={1.05} stagger={.1}>Hablemos de<br/><em>tu próximo espacio.</em></MaskedLiftText></div>
    <div className="contact-details"><MaskedLiftText as="p" trigger="scroll" delay={.2} duration={.95} stagger={.08}>Cuéntame qué estás imaginando, qué necesita tu espacio y en qué punto se encuentra la idea.</MaskedLiftText><a className="whatsapp-link" href="https://wa.me/18295550148?text=Hola%20Juan%2C%20quiero%20hablar%20sobre%20un%20proyecto" target="_blank" rel="noreferrer"><MaskedLiftText as="span" trigger="scroll" delay={.3} duration={.75} stagger={.06}>WhatsApp</MaskedLiftText><MaskedLiftText as="strong" trigger="scroll" delay={.38} duration={.9} stagger={.08}>+1 829 555 0148</MaskedLiftText><ArrowUpRight size={20}/></a><div className="contact-meta"><MaskedLiftText as="span" trigger="scroll" delay={.5} duration={.75} stagger={.06}>SANTO DOMINGO · MADRID</MaskedLiftText><MaskedLiftText as="span" trigger="scroll" delay={.56} duration={.75} stagger={.06}>RESPUESTA EN 24–48 H</MaskedLiftText></div></div>
   </section>
   <footer id="estudio"><div><MaskedLiftText as="span" className="eyebrow" trigger="scroll" delay={.05} duration={.8} stagger={.06}>LA MIRADA DE FORMA</MaskedLiftText><MaskedLiftText as="p" trigger="scroll" delay={.15} duration={1} stagger={.1}>Arquitectura para vivir.<br/><em>Espacios para sentir.</em></MaskedLiftText></div><div className="footer-right"><MaskedLiftText as="p" trigger="scroll" delay={.25} duration={.9} stagger={.08}>Cada proyecto empieza escuchando.<br/>Cada espacio encuentra su propia forma.</MaskedLiftText><button onClick={()=>goTo(0)}><MaskedLiftText as="span" trigger="scroll" delay={.38} duration={.8} stagger={.06}>Volver al primer trazo</MaskedLiftText><MoveUpRight size={18}/></button></div><div className="footer-bottom"><a href="#inicio" className="wordmark">forma<span>®</span></a><span>ARQUITECTURA & ESPACIO</span><span>© {new Date().getFullYear()} FORMA</span></div></footer>
  </main>
 </div>
}
