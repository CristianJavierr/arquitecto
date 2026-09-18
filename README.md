# FORMA — Arquitectura & espacio

Portfolio conceptual de arquitectura, creado con React 19, Vite 7 y Three.js mediante React Three Fiber. La escena es 3D en tiempo real: un arquitecto hombre dibuja, la maqueta crece con el scroll y la cámara se acerca antes del fundido a una fotografía conceptual.

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
- `src/Atelier.jsx`: hombre, mesa, objetos, arquitectura paramétrica y cámaras.
- `src/styles.css`: color terracota, tipografía y estilos responsive.
- `public/images/`: imágenes originales generadas para esta muestra, comprimidas en WebP.

Los tres proyectos son conceptuales. No representan obras construidas de un arquitecto real. Sustituir los nombres, fechas y fotografías por los datos del portfolio definitivo.

## Interacción y accesibilidad

La galería acepta botones, flechas del teclado y deslizamiento táctil. Los detalles se cierran con Escape. La escena tiene una alternativa si WebGL falla y respeta la preferencia de movimiento reducido en la animación del personaje y la construcción. El render 3D se pausa al terminar el recorrido.

Las tipografías DM Sans y Manrope se sirven desde Google Fonts, con alternativas locales de sistema. No se utilizan cookies ni almacenamiento de datos de visitantes.
