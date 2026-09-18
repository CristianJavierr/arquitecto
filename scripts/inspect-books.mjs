import fs from 'node:fs'
import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
globalThis.window={URL:globalThis.URL}
THREE.TextureLoader.prototype.load=function(url){const t=new THREE.Texture();t.userData.url=url;return t}
const b=fs.readFileSync('/tmp/forma-decorative-books.fbx');const s=new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')
s.traverse(o=>{if(o.isMesh){const box=new THREE.Box3().setFromObject(o);console.log(o.name,box.getSize(new THREE.Vector3()).toArray(),(Array.isArray(o.material)?o.material:[o.material]).map(m=>({name:m.name,map:m.map?.userData.url})))}})
