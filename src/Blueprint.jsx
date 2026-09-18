import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ease } from './journey'
function makePlan(){
 const segments=[]
 const line=(a,b)=>segments.push([a,b])
 const rect=(x,z,w,d)=>{line([x,z],[x+w,z]);line([x+w,z],[x+w,z+d]);line([x+w,z+d],[x,z+d]);line([x,z+d],[x,z])}
 const arc=(x,z,r,a,b)=>{for(let i=0;i<18;i++){const t=a+(b-a)*i/18,n=a+(b-a)*(i+1)/18;line([x+Math.cos(t)*r,z+Math.sin(t)*r],[x+Math.cos(n)*r,z+Math.sin(n)*r])}}
 // Site and perimeter; every wall belongs to the ground floor above it.
 rect(-1.96,-1.38,3.92,2.83);rect(-1.7,-1.05,3.4,2.1);rect(-1.64,-.99,3.28,1.98)
 rect(-1.42,-.83,2.86,1.47);rect(-1.38,-.79,2.78,1.39)
 // Partitions and their parallel wall faces.
 line([-.38,-.78],[-.38,-.17]);line([-.34,-.78],[-.34,-.17]);line([-.38,.17],[-.38,.61]);line([-.34,.17],[-.34,.61])
 line([.57,-.79],[.57,-.16]);line([.61,-.79],[.61,-.16]);line([.62,-.14],[1.4,-.14]);line([.62,-.10],[1.4,-.10])
 line([-.38,-.20],[.57,-.20]);line([-.38,-.16],[.57,-.16])
 // Window tracks, openings and facade fins.
 for(let i=0;i<9;i++){const x=-1.38+i*.31;line([x,.605],[x,.66])}
 line([-1.4,.66],[1.42,.66]);line([-1.4,.69],[1.42,.69])
 for(let i=0;i<11;i++)rect(-.73+i*.045,.615,.021,.095)
 // Door leaves and arcs.
 line([-.38,-.17],[-.10,-.17]);arc(-.38,-.17,.28,0,Math.PI/2)
 line([.62,-.10],[.62,.19]);arc(.62,-.10,.29,0,Math.PI/2)
 // Stairwell: tread and riser detail.
 rect(.7,-.74,.57,.48);for(let i=0;i<9;i++)line([.7,-.72+i*.05],[1.27,-.72+i*.05]);line([.985,-.70],[.985,-.32]);line([.945,-.36],[.985,-.32]);line([1.025,-.36],[.985,-.32])
 // Living room, kitchen, dining and bed.
 rect(-1.2,-.52,.58,.27);rect(-1.16,-.49,.51,.17);rect(-1.15,-.13,.45,.20)
 rect(.78,.05,.40,.32);for(const x of [.7,1.2]){rect(x,.07,.06,.1);rect(x,.24,.06,.1)}
 rect(-.20,-.68,.58,.29);rect(-.17,-.65,.25,.08);rect(.1,-.65,.25,.08)
 rect(.01,.11,.37,.28);arc(.07,.19,.035,0,Math.PI*2);arc(.3,.30,.035,0,Math.PI*2)
 // Front stairs and pool, matching the 3D base.
 for(let i=0;i<4;i++)rect(-.2-i*.04,.85+i*.12,1.35,.12)
 rect(-1.47,.85,1.65,.58);rect(-1.42,.90,1.55,.48)
 // Dimension chains and extension ticks.
 for(const z of [-1.20,1.56]){line([-1.75,z],[1.75,z]);for(const x of [-1.7,-.38,.61,1.7]){line([x,z-.06],[x,z+.06]);line([x-.025,z-.025],[x+.025,z+.025])}}
 for(const x of [-1.84,1.84]){line([x,-1.08],[x,1.1]);for(const z of [-1.05,0,1.05]){line([x-.06,z],[x+.06,z]);line([x-.025,z-.025],[x+.025,z+.025])}}
 return new Float32Array(segments.flatMap(([a,b])=>[a[0],.007,a[1],b[0],.007,b[1]]))
}
export default function Blueprint({progress,reduced}){
 const {geometry,material,source}=useMemo(()=>{const source=makePlan(),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(source.slice(),3).setUsage(THREE.DynamicDrawUsage));geometry.setDrawRange(0,0);return{source,geometry,material:new THREE.LineBasicMaterial({color:'#69452e',transparent:true,opacity:1,depthWrite:false})}},[])
 useFrame(()=>{
  const p=progress.current,draw=reduced?1:ease(.15,.365,p),num=source.length/6,position=geometry.attributes.position,k=draw*num,whole=Math.floor(k)
  position.array.set(source)
  if(whole<num){const n=whole*6,t=k-whole;for(let j=0;j<3;j++)position.array[n+3+j]=source[n+j]+(source[n+3+j]-source[n+j])*t}
  position.needsUpdate=true;geometry.setDrawRange(0,Math.min(num,whole+1)*2)
  material.opacity=1-ease(.43,.57,p)
 })
 return <lineSegments geometry={geometry} material={material} renderOrder={2}/>
}
