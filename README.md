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
- `src/Atelier.jsx`: mesa, arquitectura paramétrica y cámaras.
- `src/Architect.jsx`: hombre modelado desde cero, manos, postura y ropa.
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
