import {readFileSync} from 'node:fs'
import {resolve,dirname} from 'node:path'
import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
globalThis.ProgressEvent=class{}
for(const path of process.argv.slice(2)){
 const loader=new GLTFLoader()
 loader.register(parser=>{parser.loadTexture=()=>Promise.resolve(new THREE.Texture());return{name:'InspectNoImages'}})
 let bytes=readFileSync(path),input
 if(path.endsWith('.gltf')){
  const j=JSON.parse(bytes)
  for(const buffer of j.buffers)buffer.uri='data:application/octet-stream;base64,'+readFileSync(resolve(dirname(path),buffer.uri)).toString('base64')
  input=JSON.stringify(j)
 }else input=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)
 const {scene}=await loader.parseAsync(input,'')
 const print=o=>{const b=new THREE.Box3().setFromObject(o);console.log(o.name,JSON.stringify({min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new THREE.Vector3()).toArray()}))}
 console.log('\n'+path);print(scene)
 for(const o of scene.children.slice(0,10))print(o)
}
