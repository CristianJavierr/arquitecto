import { memo, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { theme3DColor } from './theme3d'

const ROOT = '/models/props/'
const sources = {
  chair: ROOT + 'office-chair.glb',
  lamp: ROOT + 'desk_lamp_arm_01/model.gltf',
  stationery: ROOT + 'stationery_supplies/model.gltf',
  books: ROOT + 'architecture-books.glb',
}

// Each instance owns its materials so the atelier can fade without changing
// cached assets. Imported PBR meshes stay outside the primitive-only batcher.
function Asset({ source, node, orientation = [0, 0, 0], size, axis = 'y', tint, ...props }) {
  const { scene } = useGLTF(sources[source])
  const object = useMemo(() => {
    const original = node ? scene.getObjectByName(node) : scene
    const model = original.clone(true)
    model.traverse(mesh => {
      if (!mesh.isMesh) return
      mesh.castShadow = mesh.receiveShadow = true
      const prepare = material => {
        const copy = material.clone()
        if (tint && /soft|accent/.test(copy.name)) copy.color.set(tint)
        else if (copy.color) copy.color.set(theme3DColor(copy.color))
        for (const value of Object.values(copy)) if (value?.isTexture) value.anisotropy = 4
        return copy
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(prepare) : prepare(mesh.material)
    })
    const oriented = new THREE.Group()
    oriented.rotation.set(...orientation)
    oriented.add(model)
    const group = new THREE.Group()
    group.add(oriented)
    group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(group)
    const scale = size / box.getSize(new THREE.Vector3())[axis]
    oriented.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2)
    group.scale.setScalar(scale)
    return group
  }, [scene, node, size, axis, tint, ...orientation])
  return <primitive object={object} {...props} />
}

export const OfficeChair = memo(function OfficeChair() {
  return <Asset source="chair" size={2.32} tint={theme3DColor('#626c5d')} position={[0, 0, -.04]} />
})

export const DrawingPencil = memo(function DrawingPencil() {
  return <Asset source="stationery" node="stationery_supplies_pencil_new_a" orientation={[0, 0, Math.PI / 2]} size={.34} />
})

function PencilPot() {
  return <group position={[2.79, 1.518, -1.19]}>
    <Asset source="stationery" node="stationery_supplies_pencilcup" size={.29} />
    {[
      ['pencil_new_a', -.065, -.025, -.13, -.09, .47],
      ['pencil_new_b', .047, .02, .11, .10, .43],
      ['pen_blue', -.01, .062, .08, -.04, .45],
      ['pencil_used', .054, -.056, -.11, .13, .37],
      ['pen_fancy', -.058, .034, .02, -.16, .40],
    ].map(([name, x, z, rx, rz, length]) => <group key={name} position={[x, .025, z]} rotation={[rx, 0, rz]}>
      <Asset source="stationery" node={'stationery_supplies_' + name} orientation={[0, 0, -Math.PI / 2]} size={length} />
    </group>)}
  </group>
}

function BookCover() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width=768; canvas.height=512
    const ctx=canvas.getContext('2d')
    ctx.fillStyle='#cad7de';ctx.fillRect(0,0,768,512)
    ctx.fillStyle='#314b53';ctx.font='500 20px sans-serif';ctx.fillText('ATELIER / STUDIES',46,52)
    ctx.font='600 88px sans-serif';ctx.fillText('FORM &',42,156);ctx.fillText('SPACE',42,245)
    ctx.strokeStyle='#647f86';ctx.lineWidth=2
    for(let i=0;i<6;i++){ctx.strokeRect(460+i*20,280-i*18,160,100)}
    ctx.font='18px sans-serif';ctx.fillText('Architecture, light & everyday life',46,455)
    ctx.fillText('VOL. 03',630,52)
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map
  }, [])
  return <mesh rotation={[-Math.PI/2,0,0]} position={[0,.093,0]}><planeGeometry args={[.92,.605]}/><meshStandardMaterial map={texture} roughness={.87}/></mesh>
}

function DeskObjects() {
  return <group name="DetailedDeskObjects">
    {/* The clamp straddles the rear edge, with the articulated shade over the desk. */}
    <Asset source="lamp" size={1.46} position={[-2.7, 1.374, -1.86]} rotation={[0, .18, 0]} />
    <group position={[2.81, 1.518, .85]} rotation={[0, .13, 0]}>
      <Asset source="books" node="ArchitectureAtlas" size={1.04} axis="x" />
      <Asset source="books" node="LivingSpaces" size={.91} axis="x" position={[-.025, .104, .025]} rotation={[0, -.11, 0]} />
      <Asset source="books" node="FormStudies" size={.94} axis="x" position={[.025, .263, -.02]} rotation={[0, .06, 0]} />
      <group position={[.025, .263, -.02]} rotation={[0, .06, 0]}><BookCover /></group>
    </group>
    <PencilPot />
    <Asset source="stationery" node="stationery_supplies_pencil_new_b" size={.62} axis="x" position={[-2.53, 1.547, .63]} rotation={[0, -.3, 0]} />
    <Asset source="stationery" node="stationery_supplies_eraser" size={.14} axis="x" position={[-1.99, 1.523, .76]} rotation={[0, .12, 0]} />
  </group>
}

Object.values(sources).forEach(url => useGLTF.preload(url))
export default memo(DeskObjects)
