import { memo } from 'react'
import { theme3DColor } from './theme3d'

function Block({ position, size, color }) {
  return <mesh position={position}><boxGeometry args={size}/><meshStandardMaterial color={theme3DColor(color)} roughness={.96}/></mesh>
}

// A real skyline at different depths gives each window a different view and
// parallax during the orbit. Geometry is batched with the window wall.
function CityBuilding({ x, z, height, width, depth, index, distant }) {
  const ground=-5.5,top=ground+height
  const stone=distant?'#afbfb6':['#a4b0a7','#b6b9a9','#9daa9f','#c2beaa'][index%4]
  const glazing=distant?'#849d96':'#647e77'
  const floors=Math.floor(height/.90),columns=Math.max(2,Math.floor(width/.58))
  return <group>
    <Block position={[x,ground+height/2,z]} size={[depth,height,width]} color={stone}/>
    <Block position={[x,top+.08,z]} size={[depth+.16,.16,width+.16]} color={distant?'#c4cdc0':'#d8d4bf'}/>
    {Array.from({length:floors},(_,floor)=><group key={floor}>
      {Array.from({length:columns},(_,column)=><Block key={column} position={[x+depth/2+.017,ground+.47+floor*.90,z-width/2+.36+column*(width-.72)/Math.max(1,columns-1)]} size={[.035,.48,.27]} color={glazing}/>)}
      {!distant&&floor%2===1&&<Block position={[x+depth/2+.12,ground+.19+floor*.90,z]} size={[.24,.055,width+.04]} color="#c9cbbb"/>}
    </group>)}
    {index%3===0&&<>
      <Block position={[x,top+.31,z]} size={[depth*.46,.46,width*.4]} color={stone}/>
      <Block position={[x+.1,top+.9,z]} size={[.055,1.1,.055]} color="#718b83"/>
    </>}
  </group>
}

function CityView(){
  return <group name="CityOutsideWindows">
    <Block position={[-26,6,0]} size={[.3,32,80]} color="#d5dfd4"/>
    <Block position={[-16,-5.65,0]} size={[19,.20,70]} color="#bec6b8"/>
    {[-17,-12,-7,-2,3,8,13,18].map((z,i)=><CityBuilding key={'far'+i} x={-21} z={z} height={[14,11,16,12,17,13,15,11][i]} width={3.3} depth={2.2} index={i+2} distant/>)}
    {[-13,-8.5,-4,.5,5,9.5,14].map((z,i)=><CityBuilding key={i} x={-11.9-(i%2)*1.2} z={z} height={[8.7,11.2,7.7,9.7,8.2,11.8,9.1][i]} width={2.7+(i%3)*.25} depth={2.5} index={i}/>)}
  </group>
}
export default memo(CityView)
