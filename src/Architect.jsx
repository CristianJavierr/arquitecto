import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { ease } from './journey'
import { OfficeChair, DrawingPencil } from './DeskObjects'

// The old assembled primitive figure has been replaced by an authored, textured
// humanoid with continuous skin and individually weighted finger joints.
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z)
const scratch={a:V(),b:V(),c:V(),d:V(),q:new THREE.Quaternion(),parent:new THREE.Quaternion(),world:new THREE.Quaternion()}
function aim(bone,child,target){
 bone.updateWorldMatrix(true,true)
 const start=bone.getWorldPosition(scratch.a),end=child.getWorldPosition(scratch.b)
 const current=end.sub(start).normalize(),wanted=scratch.c.copy(target).sub(start).normalize()
 scratch.q.setFromUnitVectors(current,wanted)
 bone.getWorldQuaternion(scratch.world);bone.parent.getWorldQuaternion(scratch.parent).invert()
 bone.quaternion.copy(scratch.parent.multiply(scratch.q.multiply(scratch.world)))
 bone.updateWorldMatrix(false,true)
}
function solveLimb(upper,lower,end,target,pole){
 upper.updateWorldMatrix(true,true)
 const a=upper.getWorldPosition(V()),b=lower.getWorldPosition(V()),c=end.getWorldPosition(V())
 const l1=a.distanceTo(b),l2=b.distanceTo(c),direction=target.clone().sub(a)
 const distance=THREE.MathUtils.clamp(direction.length(),Math.abs(l1-l2)+.0001,l1+l2-.0001)
 direction.normalize()
 const projection=(l1*l1-l2*l2+distance*distance)/(2*distance)
 const perpendicular=pole.clone().sub(a).addScaledVector(direction,-pole.clone().sub(a).dot(direction)).normalize()
 const bend=a.clone().addScaledVector(direction,projection).addScaledVector(perpendicular,Math.sqrt(Math.max(0,l1*l1-projection*projection)))
 aim(upper,lower,bend);aim(lower,end,target)
}
// Resolve wrist roll as well as pointing direction, so the supporting palm is flat.
function orientPalm(hand,get,side,forward,across){
 const wrist=hand.getWorldPosition(V())
 aim(hand,get(side+'HandMiddle1'),wrist.clone().add(forward))
 const axis=forward.clone().normalize()
 const current=get(side+'HandIndex1').getWorldPosition(V()).sub(get(side+'HandPinky1').getWorldPosition(V()))
 current.addScaledVector(axis,-current.dot(axis)).normalize()
 const wanted=across.clone().addScaledVector(axis,-across.dot(axis)).normalize()
 const angle=Math.atan2(axis.dot(current.clone().cross(wanted)),current.dot(wanted))
 rotateWorld(hand,axis,angle)
}
function rotateWorld(bone,axis,angle){
 const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert()
 const world=bone.getWorldQuaternion(new THREE.Quaternion())
 bone.quaternion.copy(parent.multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle).multiply(world)))
 bone.updateWorldMatrix(false,true)
}
function Architect({progress,reduced}){
 const gltf=useGLTF('/models/architect-moreno.glb?v=2'),root=useRef(),pencil=useRef(),rig=useRef(null)
 const avatar=useMemo(()=>{
  const model=clone(gltf.scene)
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;o.material=o.material.clone();o.material.roughness=Math.max(.65,o.material.roughness);if(o.material.map)o.material.map.anisotropy=4;
   o.material.emissive?.set(0);o.material.emissiveMap=null;
   if(o.name==='Wolf3D_Glasses')o.visible=false;
   if(o.name==='Wolf3D_Outfit_Top'){o.material.color.set('#687654');o.material.metalness=0}
   if(o.name==='Wolf3D_Outfit_Footwear'){o.material.map=null;o.material.color.set('#3d3933');o.material.metalness=0}}})
  return model
 },[gltf.scene])
 useLayoutEffect(()=>{
  const get=name=>avatar.getObjectByName(name),bones={}
  avatar.traverse(o=>{if(o.isBone)bones[o.name]=o})
  const rest={};for(const [name,b] of Object.entries(bones))rest[name]=b.quaternion.clone()
  // A lean from the hips and spine, rather than moving the head independently.
  get('Spine').rotateX(.12);get('Spine1').rotateX(.10);get('Spine2').rotateX(.075)
  get('Head').rotateX(.30)
  root.current.updateWorldMatrix(true,true)
  const toWorld=v=>root.current.localToWorld(v.clone())
  for(const [side,s] of [['Left',1],['Right',-1]]){
   solveLimb(get(side+'UpLeg'),get(side+'Leg'),get(side+'Foot'),toWorld(V(s*.23,.19,.74)),toWorld(V(s*.26,.99,.85)))
   // Keep the sole flat after solving the seated leg.
   aim(get(side+'Foot'),get(side+'ToeBase'),toWorld(V(s*.23,.12,1.03)))
  }
  const saved={};for(const name of ['LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','Head'])saved[name]=get(name).quaternion.clone()
  rig.current={get,bones,rest,saved,toWorld}
 },[avatar])
 useFrame(({clock})=>{
  if(!rig.current)return
  const {get,saved,toWorld}=rig.current,t=clock.elapsedTime,drawing=reduced?0:1-ease(.35,.43,progress.current)
  for(const [name,q] of Object.entries(saved))get(name).quaternion.copy(q)
  get('Head').rotateX(Math.sin(t*.65)*.008*drawing)
  root.current.updateWorldMatrix(true,true)
  // The supporting hand stays flat; the writing hand follows a small ellipse.
  for(const [side,s] of [['Left',1],['Right',-1]]){
   const writes=side==='Right',dx=writes?Math.sin(t*1.65)*.018*drawing:0,dz=writes?Math.cos(t*1.65)*.009*drawing:0
   const target=toWorld(V(writes?-.18+dx:.36,writes?1.64:1.585,writes?.78+dz:.84))
   solveLimb(get(side+'Arm'),get(side+'ForeArm'),get(side+'Hand'),target,toWorld(V(s*.49,1.55,.30)))
   const hand=get(side+'Hand')
   for(const finger of ['Thumb','Index','Middle','Ring','Pinky'])for(const j of [1,2,3]){
    const b=get(side+'Hand'+finger+j);b.quaternion.copy(rig.current.rest[b.name])
   }
   hand.updateWorldMatrix(true,true)
   const forward=V(writes?.10:-.035,0,1).normalize()
   const across=V(-s,writes?.45:0,0).normalize()
   orientPalm(hand,get,side,forward,across)
   // Flex around the anatomical knuckle axis rather than an arbitrary local X.
   const curlAxis=V(1,0,writes?-.10:.035).normalize()
   for(const finger of ['Index','Middle','Ring','Pinky'])for(const j of [1,2,3]){
    const amount=writes?(finger==='Index'?.42:finger==='Middle'?.55:.72):.025
    rotateWorld(get(side+'Hand'+finger+j),curlAxis,amount)
   }
   if(writes)rotateWorld(get(side+'HandThumb2'),V(0,1,0),-.4)

  }
  root.current.updateWorldMatrix(true,true)
  const grip=root.current.worldToLocal(get('RightHandIndex2').getWorldPosition(V()))
  const tip=V(grip.x+.028,1.545,grip.z+.028)
  const shaft=grip.clone().sub(tip).normalize()
  pencil.current.position.copy(tip)
  pencil.current.quaternion.setFromUnitVectors(V(0,1,0),shaft)

 })
 return <group ref={root} position={[.4,0,-2.65]} rotation={[0,.05,0]} name="TexturedArchitect">
  <OfficeChair/>
  <primitive object={avatar} scale={1.82} position={[0,-.80,0]} />
  <group ref={pencil}><DrawingPencil/></group>
 </group>
}
useGLTF.preload('/models/architect-moreno.glb?v=2')
export default memo(Architect)
