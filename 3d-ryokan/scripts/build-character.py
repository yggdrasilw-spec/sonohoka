"""Generate the teaching character with MPFB in portable Blender (no UI needed)."""
import bpy, sys, json, importlib

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
swim = '--swim' in sys.argv
TOOLS = ROOT.parent / '.tools'
repo = bpy.context.preferences.extensions.repos.new(name='Local MPFB build', module='character_build', custom_directory=str(TOOLS / 'mpfb2' / 'src'))
import addon_utils
MODULE = 'bl_ext.character_build.mpfb'
addon_utils.enable(MODULE, default_set=True)
def service(name, cls):
    return getattr(importlib.import_module(MODULE + '.services.' + name), cls)
HumanService = service('humanservice', 'HumanService')
TargetService = service('targetservice', 'TargetService')
ExportService = service('exportservice', 'ExportService')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
macro = TargetService.get_default_macro_info_dict()
# MakeHuman's child anchor (.1875) is about 10 years; choose 8 years.
macro.update(age=(8-1)/48, gender=1.0, muscle=.25, weight=.5)
macro['race'] = dict(asian=1.0, caucasian=0.0, african=0.0)
body = HumanService.create_human(macro_detail_dict=macro)
# Gentle stylization: rounder cheeks, a softer chin and slightly larger eyes.
for target, weight in [('head/head-round', .45), ('head/head-scale-horiz-incr', .30),
                       ('head/head-scale-vert-incr', .45), ('head/head-scale-depth-incr', .18),
                       ('expression/units/asian/mouth-corner-puller', .35),
                       ('eyebrows/eyebrows-trans-up', .10),
                       ('chin/chin-height-decr', .2), ('chin/chin-prominent-decr', .15),
                       ('cheek/l-cheek-volume-incr', .18), ('cheek/r-cheek-volume-incr', .18),
                       ('eyes/l-eye-scale-incr', .12), ('eyes/r-eye-scale-incr', .12)]:
    path = TOOLS / 'mpfb2/src/mpfb/data/targets' / (target + '.target.gz')
    if not path.exists():
        raise FileNotFoundError(path)
    TargetService.load_target(body, str(path), weight=weight)
rig = HumanService.add_builtin_rig(body, 'game_engine')
assets = TOOLS / 'makehuman-assets'
for sub, name, kind in [('eyes','low-poly','Eyes'),('eyebrows','eyebrow001','Eyebrows'),('hair','short01','Hair'),('clothes','male_casualsuit06','Clothes')]:
    if swim and kind == 'Clothes':
        path = TOOLS / 'pants03/clothes/mindfront_male_swimming_trunks_02/mindfront_male_swimming_trunks_02.mhclo'
        HumanService.add_mhclo_asset(str(path), body, asset_type=kind, subdiv_levels=0, material_type='GAMEENGINE')
        continue
    path = next((assets / sub).rglob(name + '.mhclo'))
    HumanService.add_mhclo_asset(str(path), body, asset_type=kind, subdiv_levels=0, material_type='GAMEENGINE')
skin = bpy.data.materials.new('Warm skin')
skin.diffuse_color = (.63,.37,.23,1)
skin.use_nodes = True
skin.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = (.63,.37,.23,1)
skin.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = .65
body.data.materials.clear()
body.data.materials.append(skin)
# Bake the character's chosen proportions and clothing masks, keeping its deform rig.
bpy.context.view_layer.objects.active = body
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
ExportService.bake_modifiers_remove_helpers(body, bake_masks=True, bake_subdiv=False)
for obj in list(rig.children_recursive):
    if obj.type == 'MESH':
        for poly in obj.data.polygons: poly.use_smooth = True
        for mod in list(obj.modifiers):
            if mod.type == 'SUBSURF': obj.modifiers.remove(mod)
# Use the skull crown (rather than hair volume) as the 130 cm reference.
bpy.context.view_layer.update()
height = max((body.matrix_world @ v.co).z for v in body.data.vertices)
rig.scale *= 1.3 / height
bpy.context.view_layer.update()
# Downsize textures for a local, self-contained browser asset.
for im in bpy.data.images:
    if im.size[0] > 1024 or im.size[1] > 1024:
        ratio = 1024 / max(im.size)
        im.scale(int(im.size[0]*ratio), int(im.size[1]*ratio))
    if im.source == 'FILE': im.pack()
out = ROOT / 'models'
out.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for obj in rig.children_recursive: obj.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(out / ('child-swim.glb' if swim else 'child-makehuman.glb')), export_format='GLB', use_selection=True, export_animations=False, export_morph=False)
metadata = {b.name: {'head':list(rig.matrix_world @ b.head_local), 'tail':list(rig.matrix_world @ b.tail_local)} for b in rig.data.bones}
if not swim: (out / 'child-rig.json').write_text(json.dumps(metadata, indent=2))
print('CHARACTER_BONES', [b.name for b in rig.data.bones])
print('BODY_DIMS', list(body.dimensions))
bpy.ops.wm.save_as_mainfile(filepath=str(TOOLS / ('character-swim-source.blend' if swim else 'character-source.blend')))
