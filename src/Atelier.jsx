import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import Architect from './Architect'
import Room from './Room'
import Blueprint from './Blueprint'
import { StaticBatch } from './Geometry'
const clay='#a44c35', paper='#eae1cd', dark='#343a36', skin='#c79c7f'
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v))
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)}
function Box({position=[0,0,0],size=[1,1,1],color=paper,rotation=[0,0,0],edges=false,...props}){return <mesh position={position} rotation={rotation} castShadow receiveShadow {...props}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.88}/>{edges&&<Edges color="#998c74" threshold={20}/>}</mesh>}
function Sphere({position=[0,0,0],scale=[1,1,1],color=skin,...props}){return <mesh position={position} scale={scale} castShadow {...props}><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={color} roughness={.93}/></mesh>}
function Rod({a,b,r=.04,color=paper,r2}){const {mid,q,len}=useMemo(()=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);return{mid:av.add(bv).multiplyScalar(.5),q:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()),len:d.length()}},[...a,...b]);return <mesh position={mid} quaternion={q} castShadow><cylinderGeometry args={[r2??r,r,len,12]}/><meshStandardMaterial color={color} roughness={.8}/></mesh>}
function LeafTree({position=[0,0,0],scale=1,seed=0}){return <group position={position} scale={scale}><Rod a={[0,0,0]} b={[.03,.64,0]} r={.036} color="#867451"/>{[[-.15,.57,.01],[.18,.61,.05],[.02,.79,-.07],[-.11,.77,.1],[.12,.84,.01]].map((v,i)=><group key={i}><Rod a={[.01,.37,0]} b={v} r={.016} color="#867451"/><mesh position={v} rotation={[seed+i,seed-i,seed+i*.4]} scale={[.24,.21,.23]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={['#7a8260','#949873','#85906b','#737e58','#9a9d77'][i]} roughness={1} flatShading/></mesh></group>)}</group>}
function Plant({position,scale=.2}){return <group position={position} scale={scale}><mesh position={[0,.15,0]} castShadow><cylinderGeometry args={[.22,.15,.3,12]}/><meshStandardMaterial color="#b59e80"/></mesh>{Array.from({length:7},(_,i)=><Rod key={i} a={[0,.18,0]} b={[Math.sin(i*2.4)*.18,.55+(i%3)*.07,Math.cos(i*2.4)*.18]} r={.026} color="#7e8b59"/>)}</group>}
function Glass({position,size}){return <mesh position={position} castShadow><boxGeometry args={size}/><meshStandardMaterial color="#58625c" metalness={.3} roughness={.23} transparent opacity={.74}/></mesh>}
function Floor({index}){const w=3.4-index*.5,d=2.1-index*.32,z=-index*.14;return <group position={[index*.07,0,z]}>
 <Box position={[0,.04,0]} size={[w,.095,d]} color="#e7ddc8" edges/>
 <Glass position={[.05,.345,-d*.34]} size={[w*.85,.61,.035]}/>
 {[-.35,-.12,.12,.35].map((v,i)=><Box key={'rear'+i} position={[w*v,.35,-d*.34-.024]} size={[.018,.6,.019]} color="#4d4c42"/>)}
 {Array.from({length:9},(_,i)=><Box key={'slat'+i} position={[-w*.30+i*.045,.345,-d*.34-.06]} size={[.025,.6,.09]} color="#ab7046"/>)}
 {[-1,1].map((v,i)=><Rod key={'col'+i} a={[v*w*.43,.09,-d*.4]} b={[v*w*.43,.69,-d*.4]} r={.035} color="#ede3d2"/>)}
 <Box position={[w*.3,.345,-.05]} size={[.09,.61,d*.75]} color="#d6c9ad"/>
 <Glass position={[0,.34,d*.25]} size={[w*.76,.6,.035]}/>
 <Glass position={[-w*.38,.34,-.01]} size={[.035,.6,d*.53]}/>
 {[-.35,-.12,.12,.35].map((v,i)=><Box key={i} position={[w*v,.35,d*.265+.022]} size={[.018,.6,.019]} color="#4d4c42"/>)}
 {[-1,1].map((v,i)=><Rod key={i} a={[v*w*.43,.09,d*.37]} b={[v*w*.43,.69,d*.37]} r={.035} color="#ede3d2"/>)}
 {Array.from({length:11},(_,i)=><Box key={i} position={[(index%2===0?-.73:.63)+i*.045,.345,d*.28+.04]} size={[.024,.6,.095]} color={i%2? '#9d5a38':'#b4794b'}/>)}
 {Array.from({length:8},(_,i)=><Box key={i} position={[w*.386,.345,-.3+i*.08]} size={[.095,.6,.027]} color="#a36542"/>)}
 <Box position={[0,.685,0]} size={[w+.14,.1,d+.08]} color="#e4dac5" edges/>
 <Box position={[-w*.3,.13,-.1]} size={[.39,.12,.24]} color="#c8bca1"/>
 <Box position={[-w*.3,.19,-.2]} size={[.4,.16,.06]} color="#c8bca1"/>
 <Rod a={[.1,.09,.2]} b={[.1,.25,.2]} r={.025} color="#8a7560"/>
 <Box position={[.1,.26,.2]} size={[.29,.035,.2]} color="#b9a282"/>
 <Box position={[w*.35,.72,-d*.31]} size={[.38,.11,.3]} color="#c4bba2"/>
 <LeafTree position={[w*.35,.78,-d*.31]} scale={.44} seed={index}/>
 <Box position={[-w*.3,.72,d*.21]} size={[.7,.085,.14]} color="#d0c3aa"/>
 {Array.from({length:11},(_,i)=><Plant key={i} position={[-w*.3-.3+i*.055,.75,d*.21]} scale={.16}/>)}
 </group>}
function Building({progress,reduced}){
 const floors=useRef([]),landscape=useRef(),finish=useRef(),base=useRef(),surface=useRef(),walls=useRef([])
 useLayoutEffect(()=>{
  const seen=new Set();finish.current.traverse(o=>{if(o.isMesh&&o.material?.isMeshStandardMaterial&&!seen.has(o.material)){seen.add(o.material);walls.current.push({material:o.material,color:o.material.color.clone()})}})
 },[])
 useFrame(()=>{
  const p=progress.current;let h=.012
  floors.current.forEach((g,i)=>{if(!g)return;const v=reduced?1:smooth(.405+i*.066,.535+i*.066,p);g.visible=v>.0001;g.scale.y=Math.max(.0001,v);g.position.y=h;h+=.73*g.scale.y})
  const garden=reduced?1:smooth(.48,.67,p);landscape.current.visible=garden>.001;landscape.current.scale.y=Math.max(.001,garden)
  const material=smooth(.68,.79,p)
  surface.current.color.set('#f0e9d8').lerp(new THREE.Color('#bca583'),material)
  for(const entry of walls.current){entry.material.color.copy(entry.color);if(entry.color.r>.4&&entry.color.g>.4)entry.material.color.multiplyScalar(1-material*.065)}
 })
 return <group position={[.1,1.525,.3]}>
  <Blueprint progress={progress} reduced={reduced}/>
  <mesh position={[0,0,0]} receiveShadow><boxGeometry args={[4.2,.009,3.15]}/><meshStandardMaterial ref={surface} color="#f0e9d8" roughness={.95}/></mesh>
  <group ref={finish}>{[0,1,2].map(i=><group key={i} ref={g=>floors.current[i]=g} scale={[1,.001,1]}><StaticBatch><Floor index={i}/></StaticBatch></group>)}</group>
  <group ref={landscape}><StaticBatch>
   <Box position={[-.64,.014,1.06]} size={[1.65,.018,.58]} color="#709992"/>
   {[0,1,2].map(i=><Box key={i} position={[.52-i*.04,.022+i*.035,1.17-i*.15]} size={[1.35,.035,.18]} color="#e6ddc9"/>)}
   <LeafTree position={[-1.87,.012,-.78]} scale={.67}/><LeafTree position={[1.73,.012,.69]} scale={.64} seed={2}/>
   <Plant position={[1.1,.012,1.2]} scale={.42}/><Plant position={[-1.69,.012,.73]} scale={.4}/>
  </StaticBatch></group>
 </group>
}
function DeskPlan({position=[0,1.52,0],rotation=0,scale=1}){return <group position={position} rotation={[0,rotation,0]} scale={scale}><Box size={[1.55,.009,1.03]} color="#f6f0df"/>{[-.5,-.23,.23,.5].map((x,i)=><Box key={i} position={[x,.007,0]} size={[.009,.003,.73]} color="#9d9b85"/>)}{[-.36,-.03,.36].map((z,i)=><Box key={i} position={[0,.007,z]} size={[1.06,.003,.009]} color="#9d9b85"/>)}<Box position={[.12,.008,.13]} size={[.007,.003,.4]} color="#9d9b85"/>{Array.from({length:8},(_,i)=><Box key={i} position={[.26+i*.029,.008,-.15]} size={[.007,.003,.18]} color="#9d9b85"/>)}<Box position={[-.69,.009,0]} size={[.005,.003,.79]} color="#a67758"/><Box position={[0,.009,.44]} size={[1.33,.003,.005]} color="#a67758"/></group>}
function Desk(){return <group>
 <Box position={[0,1.42,0]} size={[7.6,.17,4.6]} color="#cbb99a"/>
 <Box position={[0,1.512,0]} size={[7.59,.01,4.59]} color="#d8c9ad"/>
 {[-1,1].map((v,i)=><group key={i}><Rod a={[v*2.8,.06,-1.63]} b={[v*2.58,1.32,-1.45]} r={.065} color="#686d5a"/><Rod a={[v*2.8,.06,1.63]} b={[v*2.58,1.32,1.45]} r={.065} color="#686d5a"/><Rod a={[v*2.66,.53,-1.55]} b={[v*2.66,.53,1.55]} r={.045} color="#686d5a"/><Rod a={[v*2.58,1.31,-1.7]} b={[v*2.58,1.31,1.7]} r={.055} color="#686d5a"/></group>)}
 <DeskPlan position={[.5,1.529,-1.12]} rotation={.08}/><DeskPlan position={[-2.55,1.537,.45]} rotation={-.26} scale={.95}/>
 {/* drafting lamp */}
 <mesh position={[-2.91,1.55,-1.18]} castShadow><cylinderGeometry args={[.29,.33,.08,32]}/><meshStandardMaterial color={clay}/></mesh>
 <Rod a={[-2.91,1.59,-1.18]} b={[-3.04,2.46,-1.22]} r={.035} color={clay}/><Rod a={[-3.04,2.46,-1.22]} b={[-2.34,2.94,-.85]} r={.035} color={clay}/>
 <Sphere position={[-3.04,2.46,-1.22]} scale={[.074,.074,.074]} color="#773d2e"/>
 <group position={[-2.34,2.85,-.85]} rotation={[.1,0,-.25]}><mesh castShadow><coneGeometry args={[.29,.32,32,1,true]}/><meshStandardMaterial color={clay} side={THREE.DoubleSide}/></mesh><mesh position={[0,-.155,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.265,32]}/><meshStandardMaterial color="#f7dfb3"/></mesh></group>
 {/* books, rolls, model tools */}
 <group position={[2.86,1.59,.87]} rotation={[0,.12,0]}><Box size={[.88,.15,1.14]} color="#864935"/><Box position={[0,.08,0]} size={[.82,.015,1.09]} color="#e9dcc1"/><Box position={[-.03,.16,0]} size={[.88,.12,1.1]} color="#929780"/><Box position={[-.03,.228,0]} size={[.81,.013,1.05]} color="#e9dcc1"/></group>
 {[0,1].map(i=><group key={i} position={[-2.7+i*.36,1.64,1.64]} rotation={[0,0,Math.PI/2]}><mesh castShadow><cylinderGeometry args={[.11,.11,1.28,24]}/><meshStandardMaterial color="#f0e8d3"/></mesh><mesh position={[0,.643,0]}><cylinderGeometry args={[.07,.07,.006,24]}/><meshStandardMaterial color="#a69d86"/></mesh></group>)}
 <Box position={[-2.55,1.55,-.07]} rotation={[0,-.18,0]} size={[1.18,.014,.07]} color="#a39779"/>
 <Rod a={[-2.84,1.56,.92]} b={[-2.05,1.56,.59]} r={.02} color={clay}/>
 <mesh position={[2.79,1.72,-1.19]} castShadow><cylinderGeometry args={[.14,.13,.37,24]}/><meshStandardMaterial color="#ae6c4b"/></mesh>
 {[0,1,2,3,4].map(i=><Rod key={i} a={[2.7+i*.038,1.6,-1.19]} b={[2.67+i*.052,2.04+(i%2)*.1,-1.16+(i%3)*.04]} r={.012} color={i%2?clay:'#c2ab7b'}/>)}
 <mesh position={[2.2,1.66,-1.66]} castShadow><cylinderGeometry args={[.15,.125,.28,24]}/><meshStandardMaterial color="#eeeadc"/></mesh><mesh position={[2.2,1.804,-1.66]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.128,24]}/><meshStandardMaterial color="#594737"/></mesh><mesh position={[2.36,1.67,-1.66]}><torusGeometry args={[.09,.023,8,20]}/><meshStandardMaterial color="#eeeadc"/></mesh>
 </group>}
function AtelierScene({progress,reduced,onCapture}){
 const {camera,size,gl,scene}=useThree(), studio=useRef(),sun=useRef(),ambient=useRef(),shadow=useRef(),materials=useRef([]),captured=useRef(''),frameStats=useRef({time:0,frames:0}),shadowProgress=useRef(-1)
 const curves=useMemo(()=>({
  camera:new THREE.CatmullRomCurve3([[9,7.5,10],[9,5,-.8],[5.3,3.8,-4.7],[1.2,3.8,-4.4],[.8,7.8,-3.3]].map(p=>new THREE.Vector3(...p)),false,'centripetal'),
  target:new THREE.CatmullRomCurve3([[0,1.35,0],[.4,1.7,-1],[.4,1.7,-.65],[.25,1.65,.1],[.1,1.64,.3]].map(p=>new THREE.Vector3(...p)),false,'centripetal'),
  finalPosition:new THREE.Vector3(3.3,4.15,-6.8),finalTarget:new THREE.Vector3(.1,2.65,.1),position:new THREE.Vector3(),targetPosition:new THREE.Vector3()
 }),[])
 useLayoutEffect(()=>{const seen=new Set();studio.current.traverse(o=>{if(o.isMesh&&o.material&&!seen.has(o.material)){seen.add(o.material);materials.current.push({material:o.material,opacity:o.material.opacity});o.material.transparent=true}})},[])
 useFrame((_,dt)=>{
  const p=progress.current,mobile=size.width<650
  // Stage 1: a pronounced orbit and dolly-in. Stage 2: hold over the plan.
  // Stage 3: settle into the photograph angle. Stage 4 never moves the camera.
  const orbit=smooth(0,.16,p),rise=smooth(.405,.71,p)
  curves.camera.getPoint(orbit,curves.position);curves.target.getPoint(orbit,curves.targetPosition)
  curves.position.lerp(curves.finalPosition,rise);curves.targetPosition.lerp(curves.finalTarget,rise)
  if(mobile){curves.position.sub(curves.targetPosition).multiplyScalar(1.80).add(curves.targetPosition)}
  camera.position.copy(curves.position);camera.lookAt(curves.targetPosition)
  const intro=1-smooth(.02,.16,p)
  camera.setViewOffset(size.width,size.height,mobile?0:-size.width*.215*intro,mobile?-size.height*(.16*intro+.055*(1-intro)*(1-rise)):0,size.width,size.height)
  const fade=1-smooth(.67,.79,p);studio.current.visible=fade>.001
  for(const entry of materials.current)entry.material.opacity=entry.opacity*fade
  shadow.current.opacity=.13*fade
  sun.current.intensity=2.4+smooth(.60,.77,p)*.7
  ambient.current.intensity=1.15-smooth(.60,.77,p)*.25
  // Shadows are static once the architecture has finished; the view keeps moving.
  gl.shadowMap.autoUpdate=false
  if(shadowProgress.current<0 || (p>.40&&p<.81&&Math.abs(p-shadowProgress.current)>.003) || (p<.40&&shadowProgress.current>=.40)){gl.shadowMap.needsUpdate=true;shadowProgress.current=p}
 })
 // Render ownership stays here so the bitmap is captured after all transforms.
 useFrame((_,dt)=>{
  gl.render(scene,camera)
  const key=size.width+'x'+size.height
  if(progress.current>=.80&&captured.current!==key){
   const canvas=document.createElement('canvas');canvas.width=gl.domElement.width;canvas.height=gl.domElement.height
   const ctx=canvas.getContext('2d');ctx.fillStyle='#e5ddcf';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(gl.domElement,0,0)
   const src=canvas.toDataURL('image/webp',.96)
   const image=new Image();image.onload=()=>onCapture(src);image.src=src;captured.current=key
  }
  frameStats.current.time+=dt;frameStats.current.frames++
  if(frameStats.current.time>1){gl.domElement.dataset.drawCalls=String(gl.info.render.calls);gl.domElement.dataset.fps=String(Math.round(frameStats.current.frames/frameStats.current.time));frameStats.current={time:0,frames:0}}
 },1)
 return <>
 <ambientLight ref={ambient} intensity={1.15}/><hemisphereLight args={['#fff3db','#a69d88',1.1]}/><directionalLight ref={sun} position={[-4,9,6]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.025} shadow-bias={-.0001}/><directionalLight position={[6,5,-5]} intensity={.65} color="#e9d4af"/>
 <group ref={studio}><Room/><StaticBatch><Desk/></StaticBatch><Architect progress={progress} reduced={reduced}/></group><Building progress={progress} reduced={reduced}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial ref={shadow} opacity={.13}/></mesh>
 </>
}
function Atelier({progress,reduced,active,onCapture}){
 const [contextLost,setContextLost]=useState(false)
 return contextLost?<div className="scene-fallback"><span>El atelier está en pausa.</span><a href="#proyectos">Explorar proyectos ↗</a></div>:<Canvas frameloop={active?'always':'never'} dpr={[1,1.4]} shadows camera={{position:[9,7.5,10],fov:38,near:.1,far:100}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;gl.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setContextLost(true)},{once:true})}}><AtelierScene progress={progress} reduced={reduced} onCapture={onCapture}/></Canvas>
}
export default memo(Atelier)
