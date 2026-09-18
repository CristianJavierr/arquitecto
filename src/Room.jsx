import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { StaticBatch, Stroke } from './Geometry'
function Box({p,s,c='#dbd1bc',r}){return <mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.92}/></mesh>}
function Rod({p,radius=.025,height=1,c='#7b6650'}){return <mesh position={p} castShadow><cylinderGeometry args={[radius,radius,height,12]}/><meshStandardMaterial color={c} roughness={.9}/></mesh>}
function PottedPlant({p,scale=1}){return <group position={p} scale={scale}><mesh position={[0,.24,0]} castShadow><cylinderGeometry args={[.27,.20,.48,24]}/><meshStandardMaterial color="#ad7857"/></mesh><Rod p={[0,.95,0]} height={1.5} radius={.04} c="#6c6047"/>{Array.from({length:15},(_,i)=><group key={i} position={[Math.sin(i*2.4)*.28,.8+i*.06,Math.cos(i*2.4)*.24]} rotation={[.4+i*.19,i*.7,.5]}><mesh scale={[.21,.04,.09]} castShadow><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={['#606d45','#768259','#8b9063'][i%3]} roughness={.95}/></mesh></group>)}</group>}
function Frame({p,w=1,h=.8}){return <group position={p}><Box p={[0,0,0]} s={[w+.08,h+.08,.055]} c="#8b785a"/><Box p={[0,0,.032]} s={[w,h,.013]} c="#f0ebdc"/>{[0,1,2].map(i=><Stroke key={i} points={[[-w*.35+i*.08,-h*.3+i*.08,.042],[w*.30-i*.03,-h*.3+i*.08,.042],[w*.30-i*.03,h*.3-i*.06,.042],[-w*.35+i*.08,h*.3-i*.06,.042],[-w*.35+i*.08,-h*.3+i*.08,.042]]} radius={.003} color="#947b5c"/>)}</group>}
function Room(){const front=useRef(),right=useRef();useFrame(({camera})=>{front.current.visible=camera.position.z<5.5;right.current.visible=camera.position.x<6.5})
 return <group>
 <StaticBatch>
  {/* A furnished 14 × 12 metre cutaway atelier, open only towards the camera. */}
  <Box p={[0,-.10,0]} s={[14,.16,12]} c="#bca17c"/>
  {Array.from({length:28},(_,i)=><Box key={i} p={[-6.75+i*.5,-.016,0]} s={[.008,.003,12]} c="#a68e6d"/>)}
  {Array.from({length:7},(_,i)=><Box key={i} p={[0,-.015,-5+i*1.8]} s={[14,.003,.006]} c="#b29670"/>)}
  <Box p={[0,2.5,-5.95]} s={[14,5,.15]} c="#d8cdb6"/>
  <Box p={[-6.95,2.5,0]} s={[.15,5,12]} c="#e5dac4"/>
  <Box p={[0,.12,-5.81]} s={[14,.23,.05]} c="#bba88b"/>
  <Box p={[-6.81,.12,0]} s={[.05,.23,12]} c="#bba88b"/>
  {/* Tall bright windows, mullions and deep reveals on the left wall. */}
  {[-2.9,.1,3.1].map((z,i)=><group key={i}>
   <Box p={[-6.84,2.75,z]} s={[.14,3.5,2.5]} c="#9c8b6c"/>
   <Box p={[-6.73,2.75,z]} s={[.055,3.29,2.27]} c="#e6e8d9"/>
   <Box p={[-6.63,2.75,z]} s={[.12,3.34,.06]} c="#a59477"/>
   <Box p={[-6.63,2.73,z]} s={[.12,.055,2.30]} c="#a59477"/>
   <Box p={[-6.60,1.02,z]} s={[.45,.09,2.65]} c="#c6b79a"/>
  </group>)}
  {/* Full-height bookcase and material library at the back. */}
  {[-4.6,-2.5].map((x,i)=><group key={i}>
   <Box p={[x,1.73,-5.57]} s={[1.9,3.46,.46]} c="#a68a63"/>
   <Box p={[x,1.73,-5.30]} s={[1.75,3.30,.10]} c="#8c7455"/>
   {[.15,.92,1.7,2.5,3.36].map((y,k)=><group key={k}><Box p={[x,y,-5.25]} s={[1.94,.075,.63]} c="#b89c76"/>{k<4&&Array.from({length:7},(_,j)=><Box key={j} p={[x-.72+j*.17,y+.22+(j%3)*.022,-5.18]} s={[.105,.35+(j%3)*.044,.29]} c={['#a85e45','#e1d8c4','#6f7861','#c6af88','#575c50'][j%5]} r={[0,0,j===6?-.16:0]}/>)}</group>)}
  </group>)}
  <Frame p={[.3,2.7,-5.84]} w={1.45} h={1.2}/><Frame p={[2.0,2.7,-5.84]} w={1.45} h={1.2}/>
  {/* Low storage cabinet with wood samples and a small maquette. */}
  <Box p={[1.15,.59,-5.24]} s={[3.4,1.16,.92]} c="#aa8b63"/>
  <Box p={[1.15,1.2,-5.24]} s={[3.5,.09,1.0]} c="#d6c6a7"/>
  {[.1,1.2,2.3].map(x=><Box key={x} p={[x,.62,-4.77]} s={[1.01,1.04,.03]} c="#b69871"/>)}
  {[0,1,2].map(i=><Box key={i} p={[.15+i*.18,1.31,-5.19]} s={[.30,.12,.39]} c={['#cebf9f','#ac6d4f','#7a8270'][i]} r={[0,.12*i,0]}/>)}
  <Box p={[1.7,1.31,-5.2]} s={[.7,.12,.55]} c="#efeadb"/><Box p={[1.8,1.46,-5.2]} s={[.48,.23,.37]} c="#efeadb"/>
  <PottedPlant p={[4.7,0,-4.7]} scale={1.6}/>
  {/* Reading chair and side table. */}
  <Box p={[5.2,.50,2.4]} s={[1.35,.23,1.25]} c="#958369"/><Box p={[5.2,.98,2.92]} s={[1.35,.92,.18]} c="#a28e71"/>
  {[-1,1].map(s=><group key={s}><Box p={[5.2+s*.61,.79,2.4]} s={[.12,.45,1.2]} c="#8b7759"/><Rod p={[5.2+s*.47,.23,2.03]} height={.46}/><Rod p={[5.2+s*.47,.23,2.82]} height={.46}/></group>)}
  <Box p={[4.0,.57,2.5]} s={[.75,.08,.75]} c="#ae916c"/><Rod p={[4,.27,2.5]} height={.55} radius={.055}/>
  <Box p={[4,.64,2.5]} s={[.34,.04,.43]} c="#ad674c"/>
  <PottedPlant p={[-5.6,0,4.65]} scale={1.2}/>
  <Box p={[0,4.88,-5.5]} s={[13.8,.18,.22]} c="#ae9b7a"/>
 </StaticBatch>
 <group ref={front}><StaticBatch><Box p={[0,2.5,5.95]} s={[14,5,.15]} c="#ddd2bc"/><Frame p={[2,2.8,5.83]} w={1.2} h={1}/></StaticBatch></group>
 <group ref={right}><StaticBatch><Box p={[6.95,2.5,0]} s={[.15,5,12]} c="#e1d6c0"/></StaticBatch></group>
 </group>
}
export default memo(Room)
