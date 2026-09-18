# FORMA — Arquitectura & espacio

Portfolio conceptual de arquitectura, creado con React 19, Vite 7 y Three.js mediante React Three Fiber. La escena es 3D en tiempo real: un arquitecto hombre dibuja, la cámara rodea al hombre y entra por su hombro, el plano 2D se dibuja por trazos, la maqueta surge de ese plano y su encuadre final se captura como primera imagen del slider. La galería está integrada en la misma vista, sin una segunda sección.

## Desarrollo

```sh
npm install
npm run dev
```

## Producción

```sh
npm run build
npm run preview
```

`dist/` es una web estática y puede alojarse en cualquier servicio de hosting estático.

## Personalización

- `src/App.jsx`: nombre del estudio, textos, proyectos y galería.
- `src/Atelier.jsx`: mesa, emplazamiento de la maqueta y cámaras.
- `src/BuildingModel.jsx`: casa moderna original y montaje discreto en seis bloques.
- `src/Architect.jsx`: modelo humano GLB con texturas y esqueleto, postura sentada por cinemática inversa y animación de manos.
- `src/Room.jsx`: habitación completa en corte, ventanas y mobiliario.
- `src/Blueprint.jsx`: trazos progresivos del plano 2D.
- `src/Geometry.jsx`: geometría esculpida y agrupación de mallas para reducir llamadas de dibujo.
- `src/journey.js`: etapas y funciones de interpolación compartidas.
- `src/styles.css`: color terracota, tipografía y estilos responsive.
- `public/images/`: imágenes originales generadas para esta muestra, comprimidas en WebP.

Los tres proyectos son conceptuales. No representan obras construidas de un arquitecto real. Sustituir los nombres, fechas y fotografías por los datos del portfolio definitivo.

## Interacción y accesibilidad

La galería acepta botones, flechas del teclado y deslizamiento táctil. Los detalles se cierran con Escape. La escena tiene una alternativa si WebGL falla y respeta la preferencia de movimiento reducido en la animación del personaje y la construcción. El render 3D se pausa al terminar el recorrido.

Las tipografías DM Sans y Manrope se sirven desde Google Fonts, con alternativas locales de sistema. No se utilizan cookies ni almacenamiento de datos de visitantes.

## Continuidad y rendimiento

El scroll actualiza un objetivo; un solo reloj suavizado conduce el DOM y Three.js mediante referencias. El canvas conserva un tamaño fijo. Las piezas estáticas se agrupan por material. La cámara queda inmóvil antes de la transición final. La primera imagen se captura desde el render 3D con idéntico encuadre, se renueva al cambiar el tamaño de ventana y sustituye al canvas sin zoom ni recorte. Es un render del proyecto, no una fotografía de una obra real. Las otras dos imágenes del slider son visualizaciones conceptuales generadas.

## Modelo humano

El personaje usa otro rostro masculino de piel morena, cabello corto rizado y barba, procedente del ejemplo `male-emissive.glb` de Ready Player Me / Visage, adaptado con ropa cotidiana verde oliva. El GLB se sirve localmente. Procedencia, adaptaciones y licencia en `public/models/ATTRIBUTION.md` y `public/models/LICENSE.txt`; el script de preparación está en `scripts/prepare-architect.py`. La postura mantiene la pelvis sobre la silla y el torso fuera de la mesa; la cinemática inversa flexiona codos y rodillas. La mano izquierda se orienta con la palma hacia el papel y la derecha sujeta un lápiz cuya punta permanece sobre el plano.

### Mobiliario y objetos de mesa

La silla de oficina es un modelo GLB con respaldo de malla, apoyabrazos, mecanismo y cinco ruedas. La lámpara articulada, los libros y la papelería son modelos de Poly Haven con texturas PBR; se cargan desde archivos locales. `src/DeskObjects.jsx` controla su escala, orientación y apoyos. El lápiz de dibujo reutiliza la misma geometría detallada y mantiene la punta anclada al papel. Los materiales metálicos cuentan con reflejos de estudio generados localmente. Fuentes y licencias en `public/models/props/ATTRIBUTION.md`.

### Vista monocromática y exterior

El interruptor fijo «Monocromo» aplica una paleta de tinta morada a la escena, la galería y las imágenes del diálogo, conservando el modo color. La preferencia se guarda localmente. El canvas y su captura usan exactamente el mismo filtro de color, por lo que el cambio de modo también funciona cuando el render 3D está pausado en el slider.

Las ventanas son aberturas entre secciones de pared, con marcos y alféizares. `src/CityView.jsx` construye edificios originales en dos planos de profundidad, con ventanas, cornisas y cubiertas que producen paralaje durante el recorrido. El suelo y las paredes se extienden fuera del encuadre inicial para evitar bordes vacíos, manteniendo el desvanecimiento de las paredes al paso de la cámara.

### Casa moderna y aparición por bloques

La maqueta principal «Casa Umbral» es una vivienda moderna original de dos niveles,
modelada en Three.js: núcleo de piedra y madera, salón acristalado con mobiliario,
planta superior en voladizo, cubierta con lucernario, pérgola, terraza y piscina.
El plano 2D utiliza las mismas dimensiones, huecos y distribución del modelo.

La construcción tiene seis hitos de scroll (`HOUSE_STEPS`): base, núcleo, salón,
planta superior, cubierta con pérgola y exteriores. Cada grupo completo aparece
instantáneamente en su posición definitiva y permanece estable hasta el siguiente
hito. El retroceso deshace los mismos pasos. No hay barrido de recorte, deformación
ni desplazamiento de piezas a través de otras. Las sombras se actualizan en cada
cambio de bloque. Las partes opacas se agrupan por material y los cristales se
renderizan aparte. La cámara conserva su recorrido suave y su encuadre se captura
como primera imagen del slider cuando toda la casa está terminada.

Los libros son tres mallas distintas de Decorative Book Set 01, convertidas desde
FBX a GLB (1 MB), con cubiertas lino, salvia y azul grisáceo y páginas marfil. La
portada superior tiene una composición tipográfica original. La pila conserva las
medidas de cada volumen para que apoyen sin atravesarse. Preparación y atribuciones
en `scripts/prepare-building-books.mjs` y `public/models/props/ATTRIBUTION.md`.
