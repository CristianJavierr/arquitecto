import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
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
 <Box position={[.05,.345,-d*.34]} size={[w*.85,.61,.12]} color="#d3c7af"/>
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
function Building({progress,reduced}){const floors=useRef([]);useFrame((_,dt)=>{let h=0;floors.current.forEach((g,i)=>{if(!g)return;const v=reduced?1:smooth(.12+i*.115,.31+i*.115,progress.current);g.scale.y=THREE.MathUtils.damp(g.scale.y,.018+v*.982,6,dt);g.position.y=h;h+=.73*g.scale.y})});return <group position={[.1,1.61,.3]}>
 <Box position={[0,-.023,0]} size={[4.2,.06,3.15]} color="#f0e9d8" edges/>
 <Box position={[0,.005,.2]} size={[3.9,.065,2.85]} color="#d8cbb0"/>
 <Box position={[-.64,.044,1.06]} size={[1.65,.018,.58]} color="#8ba7a0"/>
 {[0,1,2].map(i=><Box key={i} position={[.52-i*.04,.06+i*.035,1.17-i*.15]} size={[1.35,.035,.18]} color="#e6ddc9"/>)}
 {[0,1,2].map(i=><group key={i} ref={g=>floors.current[i]=g} scale={[1,.018,1]}><Floor index={i}/></group>)}
 <LeafTree position={[-1.87,.04,-.78]} scale={.67}/><LeafTree position={[1.73,.04,.69]} scale={.64} seed={2}/>
 <Plant position={[1.1,.04,1.2]} scale={.42}/><Plant position={[-1.69,.04,.73]} scale={.4}/>
 </group>}
function Man({progress,reduced}){const wrist=useRef(), head=useRef();useFrame(({clock},dt)=>{const t=clock.elapsedTime;const drawing=!reduced&&progress.current<.58; if(wrist.current){wrist.current.position.x=drawing?Math.sin(t*2)*.033:0;wrist.current.rotation.y=drawing?Math.sin(t*2.2)*.05:0}if(head.current)head.current.rotation.x=THREE.MathUtils.damp(head.current.rotation.x,drawing?.21+Math.sin(t*.8)*.025:.11,3,dt)});return <group position={[.4,0,-2.23]} rotation={[0,.12,0]}>
 {/* chair and seated legs */}
 <Box position={[0,.85,-.02]} size={[1.1,.14,.94]} color="#74543d"/>
 <Box position={[0,1.31,-.46]} size={[1.08,.88,.1]} color="#9b654c"/>
 {[-1,1].map((v,i)=><group key={i}><Rod a={[v*.39,.1,-.39]} b={[v*.39,.83,-.34]} r={.04} color="#3d423a"/><Rod a={[v*.39,.1,.44]} b={[v*.39,.83,.34]} r={.04} color="#3d423a"/>
 <Rod a={[v*.22,1.06,0]} b={[v*.29,.94,.69]} r={.19} r2={.16} color="#596159"/><Sphere position={[v*.29,.92,.67]} scale={[.175,.19,.19]} color="#596159"/>
 <Rod a={[v*.29,.91,.67]} b={[v*.27,.25,.74]} r={.12} r2={.16} color="#596159"/><Sphere position={[v*.27,.13,.86]} scale={[.155,.13,.3]} color="#414139"/>
 </group>)}
 {/* torso with draped terracotta shirt */}
 <Sphere position={[0,1.75,.09]} scale={[.53,.75,.31]} color={clay} rotation={[.17,0,0]}/>
 <Box position={[0,1.56,.35]} size={[.018,.71,.018]} color="#87402e" rotation={[.17,0,0]}/>
 {[1.37,1.53,1.69,1.85].map(y=><Sphere key={y} position={[0,y,.374]} scale={[.018,.018,.011]} color="#dabf98"/>)}
 <Box position={[-.24,1.89,.36]} size={[.19,.18,.025]} color="#99422e" rotation={[.17,0,0]}/>
 <Rod a={[0,2.12,.14]} b={[0,2.45,.18]} r={.16} color={skin}/>
 <Box position={[-.14,2.18,.22]} size={[.18,.09,.15]} color="#b96046" rotation={[.15,0,-.3]}/><Box position={[.14,2.18,.22]} size={[.18,.09,.15]} color="#b96046" rotation={[.15,0,.3]}/>
 {/* head: short hair, ears, brow, glasses and beard */}
 <group position={[0,2.65,.22]} rotation={[.21,0,0]} ref={head}>
 <Sphere scale={[.285,.37,.27]} color={skin}/>
 <Sphere position={[0,.18,-.055]} scale={[.296,.23,.255]} color="#3f3b32"/>
 <Sphere position={[0,.06,-.165]} scale={[.287,.26,.14]} color="#3f3b32"/>
 {[-1,1].map((v,i)=><group key={i}><Sphere position={[v*.278,-.025,.005]} scale={[.055,.088,.043]} color={skin}/><Box position={[v*.145,.045,.243]} size={[.185,.094,.027]} color="#403e35"/><Box position={[v*.145,.046,.261]} size={[.15,.066,.009]} color="#aeada0"/><Rod a={[v*.235,.05,.25]} b={[v*.28,.065,.0]} r={.011} color="#3d3b33"/></group>)}
 <Rod a={[-.06,.05,.265]} b={[.06,.05,.265]} r={.012} color="#3d3b33"/>
 <Sphere position={[0,-.045,.276]} scale={[.063,.08,.069]} color="#bb8d72"/>
 <Sphere position={[0,-.175,.165]} scale={[.227,.165,.124]} color="#5c4b3f"/>
 <Sphere position={[0,-.107,.261]} scale={[.09,.037,.028]} color="#5c4b3f"/>
 <Rod a={[-.061,-.155,.28]} b={[.061,-.155,.28]} r={.009} color="#ac8269"/>
 {Array.from({length:7},(_,i)=><Rod key={i} a={[-.22+i*.065,.315,.06]} b={[-.2+i*.065,.33,-.1]} r={.014} color="#514a3a"/>)}
 </group>
 {/* left arm resting on desk */}
 <Sphere position={[-.48,2.03,.12]} scale={[.22,.24,.23]} color={clay}/>
 <Rod a={[-.48,2.04,.15]} b={[-.67,1.57,.53]} r={.145} r2={.21} color={clay}/>
 <Rod a={[-.67,1.57,.53]} b={[-.51,1.61,1.03]} r={.095} r2={.13} color={skin}/>
 <Rod a={[-.68,1.57,.5]} b={[-.65,1.57,.62]} r={.143} color="#c17757"/>
 <Sphere position={[-.47,1.61,1.11]} scale={[.105,.055,.17]} color={skin}/>
 <Rod a={[-.59,1.605,.86]} b={[-.55,1.615,.97]} r={.1} color="#444b43"/>
 {/* right sleeve and drawing hand */}
 <Sphere position={[.48,2.03,.12]} scale={[.22,.24,.23]} color={clay}/>
 <Rod a={[.48,2.03,.15]} b={[.75,1.58,.56]} r={.15} r2={.21} color={clay}/>
 <Rod a={[.75,1.58,.56]} b={[.8,1.58,.66]} r={.145} color="#c17757"/>
 <Rod a={[.8,1.58,.66]} b={[.41,1.63,1.14]} r={.085} r2={.12} color={skin}/>
 <group ref={wrist}><Sphere position={[.37,1.635,1.17]} scale={[.105,.065,.13]} color={skin}/>
 <Rod a={[.32,1.55,1.28]} b={[.47,1.98,1.12]} r={.013} color="#c19146"/><Rod a={[.32,1.55,1.28]} b={[.335,1.59,1.26]} r={.009} color="#353b33"/>
 {[0,1,2].map(i=><Rod key={i} a={[.32+i*.035,1.65,1.13]} b={[.305+i*.03,1.62,1.23]} r={.018} color={skin}/>)}</group>
 </group>}
function Blueprint({position=[0,1.52,0],rotation=0,scale=1}){return <group position={position} rotation={[0,rotation,0]} scale={scale}><Box size={[1.55,.009,1.03]} color="#f6f0df"/>{[-.5,-.23,.23,.5].map((x,i)=><Box key={i} position={[x,.007,0]} size={[.009,.003,.73]} color="#9d9b85"/>)}{[-.36,-.03,.36].map((z,i)=><Box key={i} position={[0,.007,z]} size={[1.06,.003,.009]} color="#9d9b85"/>)}<Box position={[.12,.008,.13]} size={[.007,.003,.4]} color="#9d9b85"/>{Array.from({length:8},(_,i)=><Box key={i} position={[.26+i*.029,.008,-.15]} size={[.007,.003,.18]} color="#9d9b85"/>)}<Box position={[-.69,.009,0]} size={[.005,.003,.79]} color="#a67758"/><Box position={[0,.009,.44]} size={[1.33,.003,.005]} color="#a67758"/></group>}
function Desk(){return <group>
 <Box position={[0,1.42,0]} size={[7.6,.17,4.6]} color="#cbb99a"/>
 <Box position={[0,1.512,0]} size={[7.59,.01,4.59]} color="#d8c9ad"/>
 {[-1,1].map((v,i)=><group key={i}><Rod a={[v*2.8,.06,-1.63]} b={[v*2.58,1.32,-1.45]} r={.065} color="#686d5a"/><Rod a={[v*2.8,.06,1.63]} b={[v*2.58,1.32,1.45]} r={.065} color="#686d5a"/><Rod a={[v*2.66,.53,-1.55]} b={[v*2.66,.53,1.55]} r={.045} color="#686d5a"/><Rod a={[v*2.58,1.31,-1.7]} b={[v*2.58,1.31,1.7]} r={.055} color="#686d5a"/></group>)}
 <Blueprint position={[.5,1.529,-1.12]} rotation={.08}/><Blueprint position={[-2.55,1.537,.45]} rotation={-.26} scale={.95}/>
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
function Set({progress,reduced}){const {camera,size}=useThree(), smoothP=useRef(0), target=useMemo(()=>new THREE.Vector3(),[]),pos=useMemo(()=>new THREE.Vector3(),[]),studio=useRef();useFrame((_,dt)=>{smoothP.current=THREE.MathUtils.damp(smoothP.current,progress.current,5,dt);const p=smoothP.current;const mobile=size.width<700;const a=smooth(.13,.66,p);const b=smooth(.52,.78,p);pos.set(9-a*4.65,7.5-a*2.35,10-a*4.6);target.set(.05+a*.05,1.25+a*1.2,.05+a*.25);if(mobile){pos.multiplyScalar(1.15);target.y=1.7+a*.8;}camera.position.copy(pos);camera.lookAt(target);studio.current.scale.setScalar(1-b*.02)});return <>
 <ambientLight intensity={1.25}/><hemisphereLight args={['#fff3db','#a69d88',1.4]}/><directionalLight position={[-4,9,6]} intensity={3.2} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.025} shadow-bias={-.0001}/><directionalLight position={[6,5,-5]} intensity={.7} color="#e9d4af"/>
 <group ref={studio}><Desk/><Man progress={progress} reduced={reduced}/></group><Building progress={progress} reduced={reduced}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial opacity={.13}/></mesh>
 </>}
export default function Atelier({progress,reduced,active}){const [contextLost,setContextLost]=useState(false);return contextLost?<div className="scene-fallback"><span>El atelier está en pausa.</span><a href="#proyectos">Explorar proyectos ↗</a></div>:<Canvas frameloop={active?'always':'never'} dpr={[1,1.65]} shadows camera={{position:[9,7.5,10],fov:38,near:.1,far:150}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;gl.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setContextLost(true)},{once:true})}}><Set progress={progress} reduced={reduced}/></Canvas>}
