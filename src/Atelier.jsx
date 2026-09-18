import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import Room from './Room'
import Blueprint from './Blueprint'
import BuildingModel, { HOUSE_STEPS } from './BuildingModel'
import DeskObjects from './DeskObjects'
import { StaticBatch } from './Geometry'
import { theme3DColor } from './theme3d'
const clay='#2f7698', paper='#e2f0f5', dark='#233d4a', skin='#c79c7f'
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v))
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)}
function Box({position=[0,0,0],size=[1,1,1],color=paper,rotation=[0,0,0],edges=false,...props}){return <mesh position={position} rotation={rotation} castShadow receiveShadow {...props}><boxGeometry args={size}/><meshStandardMaterial color={theme3DColor(color)} roughness={.88}/>{edges&&<Edges color="#5b8395" threshold={20}/>}</mesh>}
function Sphere({position=[0,0,0],scale=[1,1,1],color=skin,...props}){return <mesh position={position} scale={scale} castShadow {...props}><sphereGeometry args={[1,20,16]}/><meshStandardMaterial color={theme3DColor(color)} roughness={.93}/></mesh>}
function Rod({a,b,r=.04,color=paper,r2,raw=false}){const {mid,q,len}=useMemo(()=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);return{mid:av.add(bv).multiplyScalar(.5),q:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()),len:d.length()}},[...a,...b]);return <mesh position={mid} quaternion={q} castShadow><cylinderGeometry args={[r2??r,r,len,12]}/><meshStandardMaterial color={raw?color:theme3DColor(color)} roughness={.8}/></mesh>}
function LeafTree({position=[0,0,0],scale=1,seed=0}){return <group position={position} scale={scale}><Rod a={[0,0,0]} b={[.03,.64,0]} r={.036} color="#867451"/>{[[-.15,.57,.01],[.18,.61,.05],[.02,.79,-.07],[-.11,.77,.1],[.12,.84,.01]].map((v,i)=><group key={i}><Rod a={[.01,.37,0]} b={v} r={.016} color="#867451"/><mesh position={v} rotation={[seed+i,seed-i,seed+i*.4]} scale={[.24,.21,.23]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={['#7a8260','#949873','#85906b','#737e58','#9a9d77'][i]} roughness={1} flatShading/></mesh></group>)}</group>}
function Plant({position,scale=.2}){return <group position={position} scale={scale}><mesh position={[0,.15,0]} castShadow><cylinderGeometry args={[.22,.15,.3,12]}/><meshStandardMaterial color="#b59e80"/></mesh>{Array.from({length:7},(_,i)=><Rod key={i} a={[0,.18,0]} b={[Math.sin(i*2.4)*.18,.55+(i%3)*.07,Math.cos(i*2.4)*.18]} r={.026} color="#7e8b59"/>)}</group>}
function Landscape({progress}){
 const group=useRef()
 useFrame(()=>{group.current.visible=progress.current>=HOUSE_STEPS[5]})
 return <group ref={group} visible={false}><StaticBatch>
  <Box position={[0,.018,1.27]} size={[3.58,.025,.32]} color="#8d997e"/>
  <Box position={[-1.90,.018,.17]} size={[.23,.025,1.95]} color="#8d997e"/>
  <Box position={[1.90,.018,.17]} size={[.23,.025,1.95]} color="#8d997e"/>
  <LeafTree position={[-1.79,.031,1.13]} scale={.43}/>
  <LeafTree position={[1.80,.031,1.15]} scale={.43} seed={2}/>
  <Plant position={[-1.90,.031,-.55]} scale={.34}/>
  <Plant position={[1.91,.031,-.52]} scale={.34}/>
  <Plant position={[.20,.031,1.29]} scale={.28}/>
 </StaticBatch></group>
}
function Building({progress,reduced}){
 const surface=useRef()
 const finalColor=useMemo(()=>new THREE.Color(theme3DColor('#c2b7a3')),[])
 useFrame(()=>{surface.current.color.set(theme3DColor('#f0e9d8')).lerp(finalColor,smooth(.68,.79,progress.current))})
 return <group position={[.1,1.525,.3]}>
  <Blueprint progress={progress} reduced={reduced}/>
  <mesh receiveShadow><boxGeometry args={[4.2,.009,3.15]}/><meshStandardMaterial ref={surface} color={theme3DColor('#f0e9d8')} roughness={.95}/></mesh>
  <BuildingModel progress={progress} reduced={reduced}/>
  <Landscape progress={progress} reduced={reduced}/>
 </group>
}
function DeskPlan({position=[0,1.52,0],rotation=0,scale=1}){return <group position={position} rotation={[0,rotation,0]} scale={scale}><Box size={[1.55,.009,1.03]} color="#f6f0df"/>{[-.5,-.23,.23,.5].map((x,i)=><Box key={i} position={[x,.007,0]} size={[.009,.003,.73]} color="#9d9b85"/>)}{[-.36,-.03,.36].map((z,i)=><Box key={i} position={[0,.007,z]} size={[1.06,.003,.009]} color="#9d9b85"/>)}<Box position={[.12,.008,.13]} size={[.007,.003,.4]} color="#9d9b85"/>{Array.from({length:8},(_,i)=><Box key={i} position={[.26+i*.029,.008,-.15]} size={[.007,.003,.18]} color="#9d9b85"/>)}<Box position={[-.69,.009,0]} size={[.005,.003,.79]} color="#a67758"/><Box position={[0,.009,.44]} size={[1.33,.003,.005]} color="#a67758"/></group>}
function Desk(){return <group>
 <Box position={[0,1.42,0]} size={[7.6,.17,4.6]} color="#cbb99a"/>
 <Box position={[0,1.512,0]} size={[7.59,.01,4.59]} color="#d8c9ad"/>
 {[-1,1].map((v,i)=><group key={i}><Rod a={[v*2.8,.06,-1.63]} b={[v*2.58,1.32,-1.45]} r={.065} color="#b7c1c5" raw/><Rod a={[v*2.8,.06,1.63]} b={[v*2.58,1.32,1.45]} r={.065} color="#b7c1c5" raw/><Rod a={[v*2.66,.53,-1.55]} b={[v*2.66,.53,1.55]} r={.045} color="#b7c1c5" raw/><Rod a={[v*2.58,1.31,-1.7]} b={[v*2.58,1.31,1.7]} r={.055} color="#b7c1c5" raw/></group>)}
 <DeskPlan position={[.5,1.529,-1.78]} rotation={.08} scale={.70}/><DeskPlan position={[-2.55,1.537,.45]} rotation={-.26} scale={.95}/>
 {/* Paper rolls and drawing ruler. Imported props are rendered separately. */}
 {[0,1].map(i=><group key={i} position={[-2.7+i*.36,1.64,1.64]} rotation={[0,0,Math.PI/2]}><mesh castShadow><cylinderGeometry args={[.11,.11,1.28,24]}/><meshStandardMaterial color="#f0e8d3"/></mesh><mesh position={[0,.643,0]}><cylinderGeometry args={[.07,.07,.006,24]}/><meshStandardMaterial color="#a69d86"/></mesh></group>)}
 <Box position={[-2.55,1.55,-.07]} rotation={[0,-.18,0]} size={[1.18,.014,.07]} color="#a39779"/>
 <mesh position={[2.2,1.66,-1.66]} castShadow><cylinderGeometry args={[.15,.125,.28,24]}/><meshStandardMaterial color="#eeeadc"/></mesh><mesh position={[2.2,1.804,-1.66]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.128,24]}/><meshStandardMaterial color="#594737"/></mesh><mesh position={[2.36,1.67,-1.66]}><torusGeometry args={[.09,.023,8,20]}/><meshStandardMaterial color="#eeeadc"/></mesh>
 </group>}
function AtelierScene({progress,reduced}){
 const {camera,size,gl,scene}=useThree(), studio=useRef(),sun=useRef(),ambient=useRef(),shadow=useRef(),materials=useRef([]),frameStats=useRef({time:0,frames:0}),shadowProgress=useRef(-1)
 useLayoutEffect(()=>{
  const pmrem=new THREE.PMREMGenerator(gl),room=new RoomEnvironment()
  const reflection=pmrem.fromScene(room,.04)
  scene.environment=reflection.texture;scene.environmentIntensity=.25
  room.dispose();pmrem.dispose()
  return()=>{scene.environment=null;reflection.dispose()}
 },[gl,scene])
 const curves=useMemo(()=>({
  camera:new THREE.CatmullRomCurve3([[8.1,6.1,8.4],[9,5,-.8],[5.3,3.8,-4.7],[1.2,3.8,-4.4],[.8,7.8,-3.3]].map(p=>new THREE.Vector3(...p)),false,'centripetal'),
  target:new THREE.CatmullRomCurve3([[.2,1.5,-.15],[.4,1.7,-1],[.4,1.7,-.65],[.25,1.65,.1],[.1,1.64,.3]].map(p=>new THREE.Vector3(...p)),false,'centripetal'),
  finalPosition:new THREE.Vector3(3.9,4.15,-6.3),finalTarget:new THREE.Vector3(.1,2.28,.1),position:new THREE.Vector3(),targetPosition:new THREE.Vector3()
 }),[])
 useLayoutEffect(()=>{
  const seen=new Set(),entries=[]
  studio.current.traverse(object=>{
   if(!object.isMesh)return
   for(const material of Array.isArray(object.material)?object.material:[object.material]){
    if(material.userData.cutawayWall||seen.has(material))continue
    seen.add(material);entries.push({material,opacity:material.opacity,depthWrite:material.depthWrite,transparent:material.transparent})
    material.transparent=true
   }
  })
  materials.current=entries
  return()=>{for(const entry of entries){entry.material.opacity=entry.opacity;entry.material.depthWrite=entry.depthWrite;entry.material.transparent=entry.transparent}}
 },[])
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
  for(const entry of materials.current){entry.material.opacity=entry.opacity*fade;entry.material.depthWrite=entry.depthWrite&&fade===1}
  shadow.current.opacity=.13*fade
  sun.current.intensity=2.4+smooth(.60,.77,p)*.7
  ambient.current.intensity=1.15-smooth(.60,.77,p)*.25
  // Shadows are static once the architecture has finished; the view keeps moving.
  gl.shadowMap.autoUpdate=false
  if(shadowProgress.current<0 || (p>.40&&p<.81&&Math.abs(p-shadowProgress.current)>.003) || (p<.40&&shadowProgress.current>=.40)){gl.shadowMap.needsUpdate=true;shadowProgress.current=p}
 })
 // Render ownership stays here so the WebGL frame stays in sync with the scroll journey.
 useFrame((_,dt)=>{
  gl.render(scene,camera)
  frameStats.current.time+=dt;frameStats.current.frames++
  if(frameStats.current.time>1){gl.domElement.dataset.drawCalls=String(gl.info.render.calls);gl.domElement.dataset.fps=String(Math.round(frameStats.current.frames/frameStats.current.time));frameStats.current={time:0,frames:0}}
 },1)
 return <>
 <ambientLight ref={ambient} intensity={1.15}/><hemisphereLight args={['#ffffff','#9bbccc',1.1]}/><directionalLight ref={sun} position={[-4,9,6]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.025} shadow-bias={-.0001}/><directionalLight position={[6,5,-5]} intensity={.65} color="#c6e1ec"/>
 <group ref={studio}><Room progress={progress}/><StaticBatch><Desk/></StaticBatch><DeskObjects/></group><Building progress={progress} reduced={reduced}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial ref={shadow} opacity={.13}/></mesh>
 </>
}
function Atelier({progress,reduced,active}){
 const [contextLost,setContextLost]=useState(false)
 return contextLost?<div className="scene-fallback"><span>El atelier está en pausa.</span><a href="#inicio">Volver al inicio ↗</a></div>:<Canvas frameloop={active?'always':'never'} dpr={[1,1.4]} shadows camera={{position:[9,7.5,10],fov:38,near:.1,far:100}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;gl.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setContextLost(true)},{once:true})}}><AtelierScene progress={progress} reduced={reduced}/></Canvas>
}
export default memo(Atelier)
