// Adapt CC0 Poly Haven source assets into the locally served atelier models.
// Sources and licenses: public/models/props/ATTRIBUTION.md.
import fs from 'node:fs'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
globalThis.ProgressEvent=class {}
globalThis.window={URL}
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.()})} readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:application/octet-stream;base64,'+Buffer.from(b).toString('base64');this.onloadend?.()})}}
const sourceDir=process.argv[2]||'/tmp/forma-assets/modular_urban_apartments_facade'
const original=JSON.parse(fs.readFileSync(path.join(sourceDir,'model.gltf')))
const embedded=structuredClone(original)
for(const b of embedded.buffers)b.uri='data:application/octet-stream;base64,'+fs.readFileSync(path.join(sourceDir,b.uri)).toString('base64')
const loader=new GLTFLoader();loader.register(p=>{p.loadTexture=()=>Promise.resolve(new THREE.Texture());return{name:'GeometryOnly'}})
const {scene}=await loader.parseAsync(JSON.stringify(embedded),'')
const building=new THREE.Group();building.name='ResidenciasDelPatio'
function piece(group,name,x,y,z,angle=0){
 const obj=scene.getObjectByName(name).clone(true);obj.position.set(1.5,0,0)
 const pivot=new THREE.Group();pivot.add(obj);pivot.position.set(x,y,z);pivot.rotation.y=angle;group.add(pivot)
}
const materials=new Map()
function batch(group){
 group.updateMatrixWorld(true);const bins=new Map()
 group.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(Array.isArray(m))throw Error('Unexpected multi material')
 if(!materials.has(m.name)){const copy=m.clone();for(const k of Object.keys(copy))if(copy[k]?.isTexture)copy[k]=null;materials.set(m.name,copy)}
 const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld)
 for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key)
 if(!bins.has(m.name))bins.set(m.name,[]);bins.get(m.name).push(g)
 });const out=new THREE.Group();out.name=group.name
 for(const [name,geometries] of bins){const g=mergeVertices(mergeGeometries(geometries),1e-5);g.scale(.185,.185,.185);const mesh=new THREE.Mesh(g,materials.get(name));out.add(mesh);geometries.forEach(g=>g.dispose())}return out
}
// Four bays along each long facade and three along each side; five storeys.
for(let level=0;level<5;level++){
 const floor=new THREE.Group();floor.name='Floor_'+level
 const placements=[]
 for(let i=0;i<4;i++){placements.push([-4.5+i*3,-4.5,Math.PI]);placements.push([-4.5+i*3,4.5,0])}
 for(let i=0;i<3;i++){placements.push([6,-3+i*3,Math.PI/2]);placements.push([-6,-3+i*3,-Math.PI/2])}
 for(const [i,[x,z,angle]] of placements.entries()){
 const y=level*3
 const door=level===0&&(i===1||i===2)
 const balcony=level>0&&i<4&&(i===0||i===3)
 const wall=door?'wall_door_centered_large_01':balcony?'wall_door_window_small_01':'wall_window_centered_large_01'
 const opening=door?'door_centered_large_01':balcony?'door_window_small_01':'window_centered_large_01'
 piece(floor,wall,x,y,z,angle);piece(floor,opening,x,y,z,angle)
 piece(floor,'cornice_standard_standard_01',x,y+2.80,z,angle)
 if(level===4)piece(floor,'crown_standard_standard_01',x,y+3,z,angle)
 }
 building.add(batch(floor))
}
const outDir='public/models/residential-building';fs.mkdirSync(outDir,{recursive:true})
let result=await new GLTFExporter().parseAsync(building,{binary:false})
result.images=original.images;result.textures=original.textures;result.samplers=original.samplers
result.materials=result.materials.map(m=>structuredClone(original.materials.find(o=>o.name===m.name)))
for(const m of result.materials){m.doubleSided=true;if(m.name.endsWith('_glass')){m.pbrMetallicRoughness.baseColorFactor=[.12,.17,.18,1];m.alphaMode='OPAQUE';m.pbrMetallicRoughness.metallicFactor=.45;m.pbrMetallicRoughness.roughnessFactor=.28}}
// Lossless geometry compression with a byte-for-byte round-trip check.
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready])
const raw=Buffer.from(result.buffers[0].uri.split(',')[1],'base64'),chunks=[];let offset=0
for(const [i,view] of result.bufferViews.entries()){
 const accessor=result.accessors.find(a=>a.bufferView===i)
 const stride=view.byteStride||({SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[accessor.type]*(accessor.componentType===5123?2:4))
 const count=view.byteLength/stride,mode=view.target===34963?'INDICES':'ATTRIBUTES'
 const bytes=raw.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength)
 const packed=MeshoptEncoder.encodeGltfBuffer(bytes,count,stride,mode)
 const decoded=new Uint8Array(view.byteLength);MeshoptDecoder.decodeGltfBuffer(decoded,count,stride,packed,mode)
 if(!Buffer.from(decoded).equals(bytes))throw Error('Geometry compression mismatch')
 view.extensions={EXT_meshopt_compression:{buffer:1,byteOffset:offset,byteLength:packed.length,byteStride:stride,count,mode}}
 chunks.push(Buffer.from(packed));offset+=packed.length
}
result.extensionsUsed=[...(result.extensionsUsed||[]),'EXT_meshopt_compression']
result.extensionsRequired=['EXT_meshopt_compression']
result.buffers=[{byteLength:raw.length,extensions:{EXT_meshopt_compression:{fallback:true}}},{uri:'building.bin',byteLength:offset}]
fs.writeFileSync(path.join(outDir,'building.bin'),Buffer.concat(chunks))
console.log('Lossless compressed building',offset,'bytes')
for(const im of original.images){fs.mkdirSync(path.dirname(path.join(outDir,im.uri)),{recursive:true});fs.copyFileSync(path.join(sourceDir,im.uri),path.join(outDir,im.uri))}
fs.writeFileSync(path.join(outDir,'model.gltf'),JSON.stringify(result))
console.log('Building',result.meshes.length,'meshes',result.buffers[0].byteLength,'bytes')
// Select new paperback/hardcover geometry; keep bent pages, joints and spines.
THREE.TextureLoader.prototype.load=()=>new THREE.Texture()
const bytes=fs.readFileSync(process.argv[3]||'/tmp/forma-decorative-books.fbx')
const books=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
const collection=new THREE.Group()
const titles=['catalogue_hardcover_01_cover55','book_hardcover_01_cover23','book_softcover_01_cover05']
for(const [i,title] of titles.entries()){
 const geometry=books.getObjectByName(title).geometry.clone();geometry.computeBoundingBox();const bounds=geometry.boundingBox
 const g=geometry.index?geometry.toNonIndexed():geometry
 const positions=g.attributes.position,normal=g.attributes.normal;const indices=[[],[]]
 for(let k=0;k<positions.count;k+=3){let ax=0,ay=0,nx=0;for(let j=0;j<3;j++){ax+=Math.abs(positions.getX(k+j))/3;ay+=positions.getY(k+j)/3;nx+=Math.abs(normal.getX(k+j))/3}
 const cover=ax>Math.max(Math.abs(bounds.min.x),bounds.max.x)*.77||nx>.70||ay<bounds.min.y+.012
 indices[cover?0:1].push(k,k+1,k+2)
 }
 g.setIndex([...indices[0],...indices[1]]);g.clearGroups();g.addGroup(0,indices[0].length,0);g.addGroup(indices[0].length,indices[1].length,1)
 for(const name of Object.keys(g.attributes))if(!['position','normal'].includes(name))g.deleteAttribute(name)
 g.rotateX(-Math.PI/2);g.rotateZ(Math.PI/2);g.computeBoundingBox();const b=g.boundingBox;const c=b.getCenter(new THREE.Vector3());const width=b.max.x-b.min.x
 g.translate(-c.x,-b.min.y,-c.z);g.scale(1/width,1/width,1/width)
 const cover=new THREE.MeshStandardMaterial({name:['Linen','Sage','Mist'][i],color:['#e8e9e1','#9cafa6','#cad7de'][i],roughness:.83})
 const pages=new THREE.MeshStandardMaterial({name:'IvoryPages',color:'#f7f5eb',roughness:1})
 const mesh=new THREE.Mesh(g,[cover,pages]);mesh.name=['ArchitectureAtlas','LivingSpaces','FormStudies'][i];collection.add(mesh)
 console.log(mesh.name,new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3()).toArray())
}
const bookGLB=await new GLTFExporter().parseAsync(collection,{binary:true})
fs.writeFileSync('public/models/props/architecture-books.glb',Buffer.from(bookGLB));console.log('Books',bookGLB.byteLength,'bytes')
