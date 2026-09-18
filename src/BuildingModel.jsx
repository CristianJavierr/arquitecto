import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { StaticBatch } from './Geometry'
import { theme3DColor } from './theme3d'

// Whole, fixed-size volumes are assembled at distinct scroll stops.
// Keeping transforms fixed prevents floors or windows passing through each other.
export const HOUSE_STEPS=[.415,.46,.505,.55,.595,.64]
const colors={concrete:'#e6e3d9',stone:'#b8b6a9',wood:'#a7774f',metal:'#465159',glass:'#819f9d'}
function Box({p,s,c=colors.concrete,r,roughness=.82,metalness=0}){return <mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={theme3DColor(c)} roughness={roughness} metalness={metalness}/></mesh>}
function Cylinder({p,radius,height,c=colors.metal}){return <mesh position={p} castShadow receiveShadow><cylinderGeometry args={[radius,radius,height,20]}/><meshStandardMaterial color={theme3DColor(c)} roughness={.65}/></mesh>}
function Glass({p,w,h,turn=0}){return <mesh position={p} rotation={[0,turn,0]}><planeGeometry args={[w,h]}/><meshStandardMaterial color={theme3DColor(colors.glass)} metalness={.28} roughness={.12} transparent opacity={.43} depthWrite={false} side={THREE.DoubleSide}/></mesh>}
function WindowFrame({p,w,h,turn=0,panels=4}){return <group position={p} rotation={[0,turn,0]}>
 <StaticBatch>
  {[-1,1].map(side=><Box key={'horizontal'+side} p={[0,side*h/2,0]} s={[w+.025,.023,.035]} c={colors.metal}/>)}
  {Array.from({length:panels+1},(_,i)=><Box key={i} p={[-w/2+i*w/panels,0,0]} s={[.015,h,.035]} c={colors.metal}/>)}
  {Array.from({length:panels},(_,i)=><Box key={'handle'+i} p={[-w/2+(i+1)*w/panels-.03,-.035,-.022]} s={[.008,.068,.009]} c="#a3a7a2"/>)}
 </StaticBatch>
 <Glass p={[0,0,.005]} w={w} h={h}/>
 </group>}
function Sofa(){return <group position={[.32,.12,.48]}>
 <Box p={[0,.085,0]} s={[.80,.15,.34]} c="#b6b39f"/>
 <Box p={[0,.20,.14]} s={[.80,.22,.075]} c="#c9c5b4"/>
 {[-1,1].map(side=><Box key={side} p={[side*.363,.16,0]} s={[.074,.16,.33]} c="#c9c5b4"/>)}
 {[-1,1].map(side=><Box key={'cushion'+side} p={[side*.175,.167,-.025]} s={[.325,.045,.255]} c="#e8e2d1"/>)}
 <Box p={[-.22,.235,.075]} s={[.16,.15,.065]} r={[-.18,0,.10]} c="#8e9b8d"/>
 <Box p={[.16,.235,.075]} s={[.16,.15,.065]} r={[-.18,0,-.13]} c="#c09875"/>
 </group>}
function Foundation(){return <StaticBatch>
 <Box p={[0,.056,.02]} s={[3.50,.10,2.10]} c="#cac6b6"/>
 <Box p={[0,.115,.02]} s={[3.46,.018,2.06]} c="#e2ddcf"/>
 {/* Paving joints are raised hairlines, never coplanar decals. */}
 {Array.from({length:13},(_,i)=><Box key={i} p={[-1.58+i*.265,.125,.02]} s={[.002,.001,2.01]} c="#c8c3b6"/>)}
 {[-.76,-.35,.06,.47,.88].map(z=><Box key={z} p={[0,.125,z]} s={[3.41,.001,.002]} c="#c8c3b6"/>)}
 </StaticBatch>}
function ServiceWing(){return <StaticBatch>
 <Box p={[-1.505,.525,.07]} s={[.065,.80,1.60]} c={colors.stone}/>
 <Box p={[-.985,.525,.84]} s={[1.10,.80,.06]} c={colors.stone}/>
 <Box p={[-.475,.525,.42]} s={[.055,.80,.79]} c={colors.stone}/>
 <Box p={[-.985,.946,.07]} s={[1.15,.042,1.66]} c={colors.concrete}/>
 {/* Recessed timber entrance with separate reveals, slats and brass pull. */}
 <Box p={[-1.19,.525,-.72]} s={[.57,.80,.07]} c="#886d54"/>
 {Array.from({length:16},(_,i)=><Box key={i} p={[-1.456+i*.0355,.525,-.766]} s={[.020,.79,.027]} c={i%3?colors.wood:'#b78a62'}/>)}
 <Box p={[-.695,.525,-.728]} s={[.36,.80,.045]} c="#403f37"/>
 <Box p={[-.695,.525,-.754]} s={[.318,.745,.014]} c="#9b7955"/>
 <Box p={[-.572,.51,-.769]} s={[.010,.13,.012]} c="#bfa67a" metalness={.6}/>
 {Array.from({length:8},(_,i)=><Box key={'stair'+i} p={[-.92,.15+i*.045,.56-i*.10]} s={[.49,.05,.14]} c="#d4cebb"/>)}
 {/* Horizontal stone coursing on the exposed side wall. */}
 {[.28,.44,.60,.76].map(y=><Box key={y} p={[-1.54,y,.07]} s={[.002,.005,1.58]} c="#999c8f"/>)}
 </StaticBatch>}
function LivingPavilion(){return <group>
 <StaticBatch>
  <Box p={[.57,.946,.05]} s={[2.12,.042,1.70]}/>
  <Box p={[.57,.525,.85]} s={[2.04,.80,.06]} c="#d8d7cb"/>
  {[[-.445,-.755],[1.57,-.755],[1.57,.83]].map(([x,z],i)=><Box key={i} p={[x,.525,z]} s={[.05,.80,.05]}/>)}
  <Box p={[-.29,.375,.60]} s={[.25,.50,.34]} c="#b8b4a5"/>
  <Box p={[-.29,.63,.60]} s={[.29,.018,.37]} c="#efebe1"/>
  <Sofa/>
  <Box p={[.27,.215,-.08]} s={[.39,.035,.27]} c="#b19270"/>
  {[-1,1].map(side=><Box key={side} p={[.27+side*.14,.166,-.08]} s={[.026,.07,.18]} c={colors.metal}/>)}
  <Box p={[.27,.236,-.08]} s={[.10,.008,.12]} c="#e5e8df"/>
  <Cylinder p={[1.12,.305,.30]} radius={.20} height={.035} c="#c3af8f"/>
  <Cylinder p={[1.12,.211,.30]} radius={.036} height={.17}/>
  {[-1,1].map(side=><group key={side}><Box p={[1.12+side*.245,.21,.30]} s={[.16,.035,.19]} c="#949e8e"/><Box p={[1.12+side*.30,.31,.30]} s={[.026,.22,.19]} c="#949e8e"/></group>)}
  {[.15,1.12].map(x=><group key={x}><Cylinder p={[x,.83,.22]} radius={.004} height={.18}/><Cylinder p={[x,.732,.22]} radius={.065} height={.025} c="#bca47d"/></group>)}
 </StaticBatch>
 <WindowFrame p={[.555,.526,-.772]} w={1.93} h={.742} panels={4}/>
 <WindowFrame p={[1.584,.526,.035]} w={1.53} h={.742} turn={Math.PI/2} panels={3}/>
 </group>}
function UpperSuite(){return <group>
 <StaticBatch>
  <Box p={[-.44,.99,-.025]} s={[2.37,.082,1.47]}/>
  <Box p={[-1.59,1.367,-.025]} s={[.07,.67,1.47]}/>
  <Box p={[-.44,1.367,.675]} s={[2.30,.67,.07]}/>
  <Box p={[.71,1.367,-.025]} s={[.07,.67,1.47]}/>
  <Box p={[-.44,1.70,-.718]} s={[2.30,.065,.07]}/>
  {/* A bedroom visible behind the glazing, below the final roof block. */}
  <Box p={[-.60,1.115,.20]} s={[.77,.16,.77]} c="#bab4a3"/>
  <Box p={[-.60,1.212,.20]} s={[.75,.055,.75]} c="#f1eddf"/>
  <Box p={[-.60,1.218,-.02]} s={[.75,.045,.27]} c="#a4b4a7"/>
  {[-.80,-.39].map(x=><Box key={x} p={[x,1.27,.44]} s={[.29,.055,.20]} c="#e5e1d6"/>)}
  <Box p={[-.60,1.22,.60]} s={[.88,.34,.035]} c="#a7835d"/>
  {/* Deep timber fins shade one end of the upper front glazing. */}
  {Array.from({length:12},(_,i)=><Box key={i} p={[.05+i*.055,1.362,-.797]} s={[.027,.65,.13]} c={i%3?colors.wood:'#b68b63'}/>)}
 </StaticBatch>
 <WindowFrame p={[-.435,1.363,-.740]} w={2.23} h={.625} panels={5}/>
 </group>}
function RoofAndPergola(){return <StaticBatch>
 <Box p={[-.44,1.755,-.025]} s={[2.49,.105,1.59]}/>
 <Box p={[-.44,1.808,-.025]} s={[2.34,.007,1.44]} c="#c6c8bd"/>
 <Box p={[-.61,1.825,.26]} s={[.64,.034,.35]} c={colors.metal}/>
 <Box p={[-.61,1.846,.26]} s={[.60,.009,.31]} c="#86a19e" roughness={.12} metalness={.4}/>
 {[-.79,-.60,-.41].map(x=><Box key={x} p={[x,1.852,.26]} s={[.008,.004,.31]} c={colors.metal}/>)}
 {/* A lighter open roof covers the lower roof terrace. */}
 {[.85,1.52].map(x=>[-.61,.68].map(z=><Box key={x+','+z} p={[x,1.252,z]} s={[.026,.55,.026]} c={colors.metal}/>))}
 {[.85,1.52].map(x=><Box key={x} p={[x,1.536,.035]} s={[.032,.065,1.40]} c={colors.metal}/>)}
 {Array.from({length:16},(_,i)=><Box key={i} p={[1.185,1.579,-.625+i*.088]} s={[.82,.035,.042]} c={colors.wood}/>)}
 </StaticBatch>}
function Terrace(){return <group>
 <StaticBatch>
  {/* Recessed pool, coping and entry stones remain above the drawing paper. */}
  <Box p={[.48,.033,-1.285]} s={[2.04,.052,.45]} c="#d1ccb9"/>
  <Box p={[.48,.061,-1.285]} s={[1.94,.009,.35]} c="#659697" roughness={.13} metalness={.25}/>
  {[-1,1].map(side=><Box key={side} p={[.48,.068,-1.285+side*.204]} s={[2.04,.018,.04]} c="#e4dfcf"/>)}
  {[-1,1].map(side=><Box key={'end'+side} p={[.48+side*1.0,.068,-1.285]} s={[.04,.018,.37]} c="#e4dfcf"/>)}
  {[0,1,2].map(i=><Box key={i} p={[-1.05,.023+i*.031,-1.43+i*.15]} s={[.79,.045,.14]}/>)}
  <Box p={[1.19,.979,.035]} s={[.72,.018,1.37]} c="#aa8963"/>
  {Array.from({length:15},(_,i)=><Box key={i} p={[1.19,.990,-.60+i*.09]} s={[.70,.002,.004]} c="#806d53"/>)}
  {[-.28,.27].map(z=><group key={z}><Box p={[1.18,1.065,z]} s={[.27,.075,.37]} c="#e5e0cc"/><Box p={[1.29,1.15,z]} s={[.06,.18,.37]} c="#e5e0cc"/></group>)}
  <Box p={[1.64,1.00,.77]} s={[.23,.10,.15]} c="#b6b4a1"/>
  {Array.from({length:7},(_,i)=><Box key={i} p={[1.55+i*.027,1.077,.77]} s={[.022,.064,.11]} c="#7c8f70"/>)}
  <Box p={[1.2,1.252,-.739]} s={[.85,.013,.013]} c={colors.metal}/>
  <Box p={[1.63,1.252,-.015]} s={[.013,.013,1.46]} c={colors.metal}/>
  {[.78,1.20,1.63].map(x=><Box key={x} p={[x,1.12,-.739]} s={[.009,.26,.009]} c={colors.metal}/>)}
  {[-.73,0,.71].map(z=><Box key={z} p={[1.63,1.12,z]} s={[.009,.26,.009]} c={colors.metal}/>)}
 </StaticBatch>
 <Glass p={[1.20,1.12,-.738]} w={.84} h={.25}/>
 <Glass p={[1.63,1.12,-.015]} w={1.45} h={.25} turn={Math.PI/2}/>
 </group>}

function BuildingModel({progress}){
 const groups=useRef([]),lastStage=useRef(-1)
 useFrame(({gl})=>{
  const stage=HOUSE_STEPS.filter(start=>progress.current>=start).length
  if(stage===lastStage.current)return
  groups.current.forEach((group,index)=>{if(group)group.visible=index<stage})
  // Visibility changes must invalidate shadows even if scroll stops on a block.
  gl.shadowMap.needsUpdate=true
  gl.domElement.dataset.constructionBlocks=String(stage)
  lastStage.current=stage
 })
 return <group position={[0,.006,0]} name="CasaUmbral">
  {[Foundation,ServiceWing,LivingPavilion,UpperSuite,RoofAndPergola,Terrace].map((Volume,index)=><group key={index} ref={group=>groups.current[index]=group} visible={false} name={'HouseBlock'+(index+1)}><Volume/></group>)}
 </group>
}
export default memo(BuildingModel)
