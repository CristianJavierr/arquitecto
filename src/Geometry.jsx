import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Compile static model parts by material once. The resulting scene has tens,
// rather than hundreds, of separate draw calls. Moving parts remain independent.
export function StaticBatch({children}) {
 const root=useRef()
 useLayoutEffect(()=>{
  const group=root.current, buckets=new Map(), originals=[], merged=[]
  group.updateWorldMatrix(true,true)
  const inverse=group.matrixWorld.clone().invert()
  group.traverse(object=>{
   if(!object.isMesh||Array.isArray(object.material))return
   const m=object.material
   if(!m.isMeshStandardMaterial)return
   const key=[m.color.getHex(),m.roughness,m.metalness,m.opacity,m.transparent,m.side].join(':')
   if(!buckets.has(key))buckets.set(key,{material:m,geometries:[]})
   const g=object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()
   g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,object.matrixWorld))
   // All source primitives are normalized to the same attribute layout.
   for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name)
   if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2))
   buckets.get(key).geometries.push(g);originals.push(object)
  })
  for(const {material,geometries} of buckets.values()){
   const geometry=mergeGeometries(geometries,false)
   geometries.forEach(g=>g.dispose())
   if(!geometry)continue
   const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true
   group.add(mesh);merged.push(mesh)
  }
  originals.forEach(o=>o.visible=false)
  return()=>{merged.forEach(o=>{group.remove(o);o.geometry.dispose()});originals.forEach(o=>o.visible=true)}
 },[])
 return <group ref={root}>{children}</group>
}

// Elliptical cross sections sculpt the torso and face as continuous surfaces.
export function Sculpt({rings,color,position,rotation,segments=40}){
 const geometry=useMemo(()=>{
  const vertices=[],uv=[],indices=[]
  rings.forEach(([y,rx,rz,z=0],j)=>{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push(Math.sin(a)*rx,y,Math.cos(a)*rz+z);uv.push(i/segments,j/(rings.length-1));if(j<rings.length-1&&i<segments){const n=j*(segments+1)+i;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1)}}})
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g
 },[rings,segments])
 return <mesh geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.86}/></mesh>
}
export function Limb({points,radii,color,segments=18,sides=16}){
 const geometry=useMemo(()=>{
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)))
  const frames=curve.computeFrenetFrames(segments,false),vertices=[],indices=[]
  for(let j=0;j<=segments;j++){
   const t=j/segments,p=curve.getPoint(t),k=t*(radii.length-1),n=Math.min(radii.length-2,Math.floor(k)),r=THREE.MathUtils.lerp(radii[n],radii[n+1],k-n)
   for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,v=p.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);vertices.push(v.x,v.y,v.z);if(j<segments&&i<sides){const z=j*(sides+1)+i;indices.push(z,z+1,z+sides+1,z+1,z+sides+2,z+sides+1)}}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g
 },[points,radii,segments,sides])
 return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.86}/></mesh>
}
export function Stroke({points,color='#514438',radius=.006}){
 const geometry=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(8,points.length*5),radius,6,false),[points,radius])
 return <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={.9}/></mesh>
}
