# Atelier character

The character in `architect-moreno.glb` uses the head, hair, skin and skeleton from
Ready Player Me / Visage's `male-emissive.glb` sample, with the everyday clothing
meshes from its `male.glb` sample. This is a different face and hairstyle from the
previous beige-clothed character.

Sources at revision `adf92f2c8abf0934e35bf8976904b0967b40ffff`:
- https://github.com/readyplayerme/visage/blob/adf92f2c8abf0934e35bf8976904b0967b40ffff/public/male-emissive.glb
- https://github.com/readyplayerme/visage/blob/adf92f2c8abf0934e35bf8976904b0967b40ffff/public/male.glb

Repository license: MIT, reproduced in LICENSE.txt.

Adaptations: clothing mesh transfer, olive fabric tint, disabled emissive effects
and glasses, seated inverse-kinematics pose, wrist/palm orientation, individual
finger articulation, drawing animation, custom chair and pencil.

To regenerate the combined asset, download the two upstream files and run:

    python3 scripts/prepare-architect.py male-emissive.glb male.glb public/models/architect-moreno.glb

The production asset is self-contained and does not request any external model service.
