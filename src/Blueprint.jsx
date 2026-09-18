import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ease } from './journey'
import { theme3DColor } from './theme3d'
function makePlan(){
 const segments=[]
 const line=(a,b)=>segments.push([a,b])
 const rect=(x,z,w,d)=>{line([x,z],[x+w,z]);line([x+w,z],[x+w,z+d]);line([x+w,z+d],[x,z+d]);line([x,z+d],[x,z])}
 const arc=(x,z,r,a,b)=>{for(let i=0;i<18;i++){const t=a+(b-a)*i/18,n=a+(b-a)*(i+1)/18;line([x+Math.cos(t)*r,z+Math.sin(t)*r],[x+Math.cos(n)*r,z+Math.sin(n)*r])}}
 // Casa Umbral: foundation, service wing and glazed living pavilion.
 rect(-1.96,-1.50,3.92,2.98);rect(-1.75,-1.03,3.5,2.10)
 rect(-1.5375,-.77,3.145,1.64);rect(-1.475,-.71,3.02,1.50)
 // Entry and service core match the left-hand 3D volume.
 rect(-1.5375,-.77,1.09,1.64);line([-.475,.025],[-.475,.815]);line([-.447,.025],[-.447,.815])
 rect(-1.465,-.79,.59,.04);for(let i=0;i<16;i++)line([-1.456+i*.0355,-.80],[-1.456+i*.0355,-.75])
 line([-.86,-.74],[-.54,-.74]);arc(-.86,-.74,.32,0,Math.PI/2)
 // Stair, kitchen, sofa, coffee table and dining table.
 rect(-1.165,-.19,.49,.88);for(let i=0;i<8;i++)line([-1.165,-.14+i*.10],[-.675,-.14+i*.10])
 line([-.92,-.1],[-.92,.59]);line([-.96,.53],[-.92,.59]);line([-.88,.53],[-.92,.59])
 rect(-.435,.415,.29,.37)
 rect(-.08,.31,.80,.34);rect(-.08,.615,.80,.075)
 rect(-.015,.36,.325,.255);rect(.335,.36,.325,.255)
 rect(.075,-.215,.39,.27);rect(.22,-.14,.10,.12)
 arc(1.12,.30,.20,0,Math.PI*2);rect(.795,.205,.16,.19);rect(1.285,.205,.16,.19)
 // Curtain wall tracks and mullions; glass wraps the east corner.
 rect(-.41,-.791,1.93,.036);for(let i=0;i<=4;i++)rect(-.4175+i*1.93/4,-.80,.015,.055)
 rect(1.565,-.73,.036,1.53);for(let i=0;i<=3;i++)rect(1.55,-.7375+i*.51,.055,.015)
 // Upper cantilever is drawn with dashed projection lines.
 for(let i=0;i<18;i++){line([-1.625+i*.132,-.76],[-1.565+i*.132,-.76]);line([-1.625+i*.132,.71],[-1.565+i*.132,.71])}
 for(let i=0;i<11;i++){line([.745,-.75+i*.132],[.745,-.69+i*.132]);line([-1.625,-.75+i*.132],[-1.625,-.69+i*.132])}
 // Entry pavers, pool and garden align with the last construction block.
 rect(-.54,-1.51,2.04,.45);rect(-.49,-1.46,1.94,.35)
 for(let i=0;i<3;i++)rect(-1.445,-1.50+i*.15,.79,.14)
 rect(-1.79,1.11,3.58,.32);rect(-2.015,-.805,.23,1.95);rect(1.785,-.805,.23,1.95)
 for(const [x,z] of [[-1.79,1.13],[1.8,1.15]]){arc(x,z,.14,0,Math.PI*2);arc(x,z,.08,0,Math.PI*2)}
 // Dimension chains and extension ticks.
 for(const z of [-.94,1.0]){line([-1.61,z],[1.65,z]);for(const x of [-1.5375,-.447,1.6075]){line([x,z-.045],[x,z+.045]);line([x-.025,z-.025],[x+.025,z+.025])}}
 for(const x of [-1.68,1.72]){line([x,-.84],[x,.92]);for(const z of [-.77,.035,.87]){line([x-.045,z],[x+.045,z]);line([x-.025,z-.025],[x+.025,z+.025])}}
 return new Float32Array(segments.flatMap(([a,b])=>[a[0],.007,a[1],b[0],.007,b[1]]))
}
export default function Blueprint({progress,reduced}){
 const {geometry,material,source}=useMemo(()=>{const source=makePlan(),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(source.slice(),3).setUsage(THREE.DynamicDrawUsage));geometry.setDrawRange(0,0);return{source,geometry,material:new THREE.LineBasicMaterial({color:theme3DColor('#69452e'),transparent:true,opacity:1,depthWrite:false})}},[])
 useFrame(()=>{
  const p=progress.current,draw=reduced?1:ease(.15,.365,p),num=source.length/6,position=geometry.attributes.position,k=draw*num,whole=Math.floor(k)
  position.array.set(source)
  if(whole<num){const n=whole*6,t=k-whole;for(let j=0;j<3;j++)position.array[n+3+j]=source[n+j]+(source[n+3+j]-source[n+j])*t}
  position.needsUpdate=true;geometry.setDrawRange(0,Math.min(num,whole+1)*2)
  material.opacity=1-ease(.43,.57,p)
 })
 return <lineSegments geometry={geometry} material={material} renderOrder={2}/>
}
