import * as THREE from 'three'

// Keep the original material values, but move warm cream, tan and terracotta
// materials into the same cool blue/white language as the interface.
export function theme3DColor(value) {
 const color=new THREE.Color(value),hsl={h:0,s:0,l:0}
 color.getHSL(hsl)
 const warm=hsl.s>.035&&(hsl.h<.18||hsl.h>.94)
 if(!warm)return value
 const lightness=hsl.l>.82?.91:hsl.l>.62?.78:hsl.l>.42?.58:Math.max(.24,hsl.l)
 const saturation=hsl.l>.82?.16:Math.min(.62,Math.max(.22,hsl.s+.12))
 color.setHSL(.56,saturation,lightness)
 return '#'+color.getHexString()
}
