# Architecture, office chair and desktop props

All downloaded models are served locally. The source licenses allow reuse and
adaptation under CC0 1.0 Universal: https://creativecommons.org/publicdomain/zero/1.0/

- `office-chair.glb`: Task chair with mesh back, Downtown Office Interiors,
  by 3D Assets. Source: https://3dassets.dev/assets/downtown-office-interiors-task-chair-mesh-b69df323
  Download: https://cdn.3dassets.dev/assets/16979/v1/model.glb
  Source reports AI-assisted authoring. Adaptations: olive upholstery, scale and placement.
- `desk_lamp_arm_01`: Kuutti Siitonen (model/textures), Yann Kervran (rig),
  Poly Haven. https://polyhaven.com/a/desk_lamp_arm_01
- `stationery_supplies`: Mateusz Sadek, Poly Haven.
  https://polyhaven.com/a/stationery_supplies
  Individual meshes are reused for the cup, loose pencil, eraser, writing pencil
  and the pencils/pens inside the cup.
- `architecture-books.glb`: three meshes from **Decorative Book Set 01**, by
  James Ray Cock, Poly Haven. https://polyhaven.com/a/decorative_book_set_01
  Source: 1K FBX, selected meshes `catalogue_hardcover_01_cover55`,
  `book_hardcover_01_cover23`, `book_softcover_01_cover05`.
  Adaptations: isolated meshes, horizontal orientation, linen/sage/mist cover
  materials, ivory page materials and original typographic cover in DeskObjects.jsx.
The house currently displayed is an original parametric model in
`src/BuildingModel.jsx`. It does not use the apartment facade kit from the earlier
version. The preparation script retains support for that prior CC0 source:
Modular Urban Apartments Facade by James Ray Cock, Poly Haven,
https://polyhaven.com/a/modular_urban_apartments_facade.

Poly Haven licensing: https://polyhaven.com/license
The lamp and stationery retain their source geometry and PBR maps. Position, rotation
and scale are adapted in src/DeskObjects.jsx. Imported textured meshes deliberately
remain outside the procedural StaticBatch to preserve texture/material bindings.

Preparation: `scripts/prepare-building-books.mjs <facade-source-folder> <books-source.fbx>`.
The source downloads come from https://api.polyhaven.com/files/ASSET_ID;
the script writes only the selected/assembled assets to public/models.
