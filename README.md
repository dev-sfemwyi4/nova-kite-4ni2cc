# nova-kite-4ni2cc

**Nova Keep arena — r18 original 3D troops.** [`nova_keep_arena_r18.html`](nova_keep_arena_r18.html) is a single offline HTML file. Open it in a browser and play.

- Every troop (122 unit keys, plus their evo and hero variants) is a real 3D model. Models are built from primitives (spheres, frustums, boxes, tori) and rendered in WebGL with a depth buffer, toon shading, an outline pass and a bone rig. The rig is driven by each unit's simulation state: walk phase, attack timer, recoil and 360° facing.
- All troop designs and names are original (for example Bramble Warden, Reed Twins, Bone Mites, Mudlarks and Sky Barge). Card portraits are rendered from the same models.
- Gameplay is unchanged. Card keys, stats, targeting and behaviour come from the r17 source.

## Layout
- `src/r18/engine.js`: WebGL renderer, mesh generators, rig and frame cache
- `src/r18/parts.js`: modelling kit (humanoid, beast, critter, drake, construct, mote, barge and cart archetypes, plus faces, headgear, weapons and extras)
- `src/r18/roster.js`: one entry per troop key, with name, card text and model builder
- `src/r18/hook.js`: hooks the models into the existing battle renderer and card art
- `tools/build_standalone.py`: builds the standalone file from the r17 source HTML

## Rebuild
```
python3 -I tools/build_standalone.py clash_royale_arena_r17_3d_troops.html nova_keep_arena_r18.html
```
The build removes every embedded troop render and troop card picture, drops the old r17 relief layer, injects the r18 layer and rebrands the visible title.
