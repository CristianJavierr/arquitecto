import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sculpt, Limb, Stroke, StaticBatch } from './Geometry'
import { ease } from './journey'

const skin='#c39a7c',shirt='#a45e46',seam='#874832',pants='#4e5550',hair='#3c322b'
function Oval({at=[0,0,0],size=[1,1,1],color=skin,rotation}){return <mesh position={at} scale={size} rotation={rotation} castShadow receiveShadow><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={color} roughness={.83}/></mesh>}
function Block({at,size,color,rotation}){return <mesh position={at} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.83}/></mesh>}
function Tube({points,radii,color,...rest}){return <Limb points={points} radii={radii} color={color} sides={20} segments={24} {...rest}/>}
function Head(){return <StaticBatch>
 {/* Continuous cheekbones, narrower temples, sculpted jaw and chin. */}
 <Sculpt color={skin} rings={[[-.30,.018,.027,.037],[-.275,.078,.085,.033],[-.237,.135,.115,.024],[-.185,.179,.148,.013],[-.108,.195,.170,.005],[-.023,.209,.19,0],[.085,.203,.195,-.013],[.182,.192,.18,-.022],[.25,.153,.14,-.027],[.289,.075,.068,-.024],[.299,.004,.004,-.024]]}/>
 <Oval at={[0,-.227,.119]} size={[.106,.056,.056]} color="#bd9476"/>
 <Oval at={[-.131,-.042,.12]} size={[.074,.076,.071]}/><Oval at={[.131,-.042,.12]} size={[.074,.076,.071]}/>
 <Sculpt color={hair} rings={[[.145,.20,.184,-.029],[.205,.191,.173,-.029],[.274,.151,.126,-.032],[.312,.065,.058,-.032],[.317,.003,.003,-.031]]}/>
 <Oval at={[0,.075,-.157]} size={[.194,.182,.067]} color={hair}/>
 {[-1,1].map(s=><group key={s}>
  <Oval at={[s*.194,.10,-.074]} size={[.021,.096,.105]} color={hair}/>
  <Oval at={[s*.208,-.024,-.022]} size={[.035,.064,.037]}/><Oval at={[s*.226,-.02,.0]} size={[.009,.038,.016]} color="#a6785e"/>
  <Oval at={[s*.091,.025,.169]} size={[.047,.017,.016]} color="#ded0b9"/><Oval at={[s*.093,.022,.184]} size={[.014,.015,.004]} color="#443e32"/>
  <Stroke points={[[s*.044,.072,.181],[s*.092,.081,.179],[s*.144,.059,.162]]} radius={.010} color={hair}/>
  <Stroke points={[[s*.047,-.075,.177],[s*.074,-.118,.174],[s*.085,-.15,.155]]} radius={.0025} color="#ae8064"/>
 </group>)}
 <Oval at={[0,-.035,.182]} size={[.030,.072,.039]}/><Oval at={[0,-.085,.223]} size={[.036,.025,.031]} color="#c09678"/>
 {[-1,1].map(s=><Oval key={s} at={[s*.027,-.087,.207]} size={[.019,.015,.021]} color="#bd8e70"/>)}
 <Stroke points={[[-.057,-.145,.171],[0,-.151,.189],[.057,-.145,.171]]} radius={.0055} color="#976e59"/>
 <Oval at={[0,-.166,.168]} size={[.044,.008,.015]} color="#bb8b70"/>
 {/* Short, fitted beard, stubble follows the jaw rather than protruding. */}
 <Sculpt color="#645042" rings={[[-.285,.05,.063,.046],[-.255,.099,.094,.036],[-.211,.155,.132,.021],[-.180,.178,.151,.012]]}/>
 <Stroke points={[[-.05,-.122,.176],[0,-.117,.195],[.05,-.122,.176]]} radius={.008} color="#685044"/>
 {Array.from({length:8},(_,i)=><Stroke key={i} radius={.003} color="#4a3b30" points={[[-.16+i*.043,.197,.097],[-.14+i*.035,.284,.035],[-.09+i*.026,.279,-.096]]}/>)}
 {/* Thin open wire frames: visible eyes, no opaque black blocks. */}
 {[-1,1].map(s=><group key={s} position={[s*.096,.028,.199]}>
  <Stroke radius={.005} color="#4a4237" points={[[-.071,.025,0],[-.056,.040,0],[.054,.040,0],[.071,.024,0],[.063,-.029,0],[.044,-.038,0],[-.046,-.038,0],[-.066,-.025,0],[-.071,.025,0]]}/>
  <Stroke radius={.005} color="#4a4237" points={[[s*.068,.028,0],[s*.111,.028,-.11],[s*.115,-.014,-.19]]}/>
 </group>)}
 <Stroke points={[[-.026,.034,.203],[0,.044,.207],[.026,.034,.203]]} radius={.005} color="#4a4237"/>
 </StaticBatch>}
function Palm({writing=false}){return <StaticBatch>
 <Oval at={[0,0,0]} size={[.07,.032,.089]}/>
 {[0,1,2,3].map(i=>{
  const x=(i-1.5)*.031,length=[.079,.097,.090,.070][i]
  return <Tube key={i} color={skin} sides={10} segments={12} radii={[.0135,.012,.008]} points={[[x,0,.042],[x,-.012,.081],[x,-.023,.064+length]]}/>
 })}
 <Tube radii={[.022,.018,.011]} color={skin} sides={12} points={[[.052,0,-.028],[.080,-.010,.014],[writing?.038:.085,-.023,.065]]}/>
 {writing&&<>
  <Tube points={[[.020,-.023,.092],[.035,.28,-.055]]} radii={[.009,.009]} color="#bb914f" sides={6}/>
  <Tube points={[[.020,-.023,.092],[.018,-.050,.105]]} radii={[.009,.001]} color="#33352c" sides={6}/>
  <Tube points={[[.020,.006,.046],[.04,.018,.077],[.031,-.009,.094]]} radii={[.013,.013,.010]} color={skin} sides={10}/>
 </>}
 </StaticBatch>}
function Architect({progress,reduced}){
 const head=useRef(),drawing=useRef()
 useFrame(({clock})=>{const t=clock.elapsedTime,a=reduced?0:1-ease(.35,.43,progress.current);head.current.rotation.x=.27+Math.sin(t*.6)*.009*a;head.current.rotation.y=-.05+Math.sin(t*.45)*.012*a;drawing.current.rotation.y=Math.sin(t*1.6)*.007*a;drawing.current.rotation.x=Math.sin(t*1.9)*.004*a})
 return <group position={[.4,0,-2.23]} rotation={[0,.05,0]}>
  <StaticBatch>
   {/* Upholstered drafting chair and natural seated trousers. */}
   <Oval at={[0,.84,-.06]} size={[.46,.105,.42]} color="#695c48"/><Block at={[0,1.2,-.43]} size={[.79,.67,.075]} color="#977753"/>
   <Tube points={[[0,.13,-.07],[0,.81,-.07]]} radii={[.044,.06]} color="#4b5046"/>
   {[0,1,2,3,4].map(i=><Tube key={i} points={[[0,.16,-.07],[Math.sin(i*1.256)*.50,.08,-.07+Math.cos(i*1.256)*.50]]} radii={[.035,.026]} color="#4b5046"/>)}
   {[-1,1].map(s=><group key={s}>
    <Tube points={[[s*.19,.98,-.02],[s*.24,.98,.28],[s*.28,.83,.65],[s*.27,.29,.73]]} radii={[.174,.163,.139,.093]} color={pants}/>
    <Stroke points={[[s*.31,1.02,.10],[s*.39,.91,.46],[s*.38,.68,.66],[s*.35,.29,.73]]} radius={.004} color="#6c7369"/>
    <Oval at={[s*.27,.16,.85]} size={[.13,.11,.25]} color="#594638"/><Block at={[s*.27,.079,.86]} size={[.24,.028,.39]} color="#8b765c"/>
   </group>)}
   {/* Sculpted, forward-leaning torso with a tapered waist and shoulder line. */}
   <Sculpt position={[0,1.0,0]} color={shirt} rings={[[0,.28,.18,.04],[.08,.31,.205,.065],[.24,.325,.21,.105],[.44,.35,.225,.135],[.64,.385,.233,.165],[.78,.41,.218,.18],[.86,.365,.197,.19],[.96,.18,.133,.207],[.989,.123,.106,.212]]}/>
   <Stroke color={seam} radius={.006} points={[[0,1.09,.27],[0,1.32,.329],[0,1.56,.39],[0,1.82,.409],[0,1.97,.334]]}/>
   {[1.22,1.40,1.58,1.76,1.91].map((y,i)=><Oval key={y} at={[.012,y,[.303,.363,.4,.411,.366][i]]} size={[.011,.011,.005]} color="#d4baa0"/>)}
   <Sculpt position={[0,1.93,.21]} color={skin} rings={[[0,.102,.094],[.13,.091,.09],[.18,.099,.097]]}/>
   <Sculpt position={[0,1.91,.21]} color="#bd7858" rings={[[0,.151,.131],[.085,.118,.103]]}/>
   <Block at={[-.123,1.924,.328]} size={[.14,.125,.021]} rotation={[.22,0,-.4]} color="#b36f50"/><Block at={[.123,1.924,.328]} size={[.14,.125,.021]} rotation={[.22,0,.4]} color="#b36f50"/>
   <Block at={[-.20,1.66,.401]} size={[.137,.145,.014]} color="#9a563e"/><Stroke color="#c58967" radius={.003} points={[[-.266,1.72,.41],[-.131,1.72,.41]]}/>
   {[-1,1].map(s=><group key={s}><Stroke points={[[s*.33,1.35,.219],[s*.26,1.38,.275],[s*.17,1.36,.302]]} radius={.004} color="#b77555"/><Stroke points={[[s*.36,1.52,.241],[s*.29,1.48,.311]]} radius={.003} color={seam}/></group>)}
   {/* Left elbow rests just outside the paper; forearm and wrist are continuous. */}
   <Tube points={[[-.338,1.824,.22],[-.49,1.74,.30],[-.60,1.638,.50]]} radii={[.172,.144,.112]} color={shirt}/>
   <Tube points={[[-.60,1.638,.50],[-.56,1.625,.72],[-.43,1.603,.96],[-.36,1.594,1.13]]} radii={[.104,.092,.067,.047]} color={skin}/>
   <Tube points={[[-.585,1.664,.473],[-.598,1.636,.544]]} radii={[.123,.12]} color="#c08460"/>
   <Tube points={[[-.387,1.599,1.064],[-.37,1.595,1.107]]} radii={[.056,.054]} color="#514638"/>
   <Oval at={[-.38,1.654,1.085]} size={[.039,.01,.04]} color="#c5b18c"/>
  </StaticBatch>
  <group ref={head} position={[0,2.31,.295]} rotation={[.27,-.05,0]}><Head/></group>
  <group position={[-.34,1.586,1.195]} rotation={[0,.27,0]}><Palm/></group>
  <group ref={drawing} position={[.338,1.824,.22]}>
   <StaticBatch>
    <Tube points={[[0,0,0],[.17,-.092,.105],[.28,-.187,.305]]} radii={[.172,.14,.112]} color={shirt}/>
    <Tube points={[[.28,-.187,.305],[.26,-.200,.48],[.11,-.22,.765],[-.035,-.234,1.015]]} radii={[.104,.097,.070,.047]} color={skin}/>
    <Tube points={[[.269,-.160,.276],[.281,-.192,.341]]} radii={[.124,.12]} color="#c08460"/>
   </StaticBatch>
   <group position={[-.061,-.241,1.077]} rotation={[0,-.41,0]}><Palm writing/></group>
  </group>
 </group>
}
export default memo(Architect)
