import bpy, sys, json
from pathlib import Path
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(__import__('pathlib').Path(__file__).resolve().parents[1]/'models/child-swim.glb'))
seated = '--seated' in sys.argv
if seated:
    # Reconstruct the actual Three.js skin deformation, retaining GLB materials.
    for obj in list(bpy.context.scene.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for item in json.loads((Path(__file__).resolve().parents[2]/'.tools/swim-seated.json').read_text()):
        data=bpy.data.meshes.new(item['name'])
        indices=item['indices']
        data.from_pydata(item['vertices'],[],[indices[i:i+3] for i in range(0,len(indices),3)])
        obj=bpy.data.objects.new(item['name'],data)
        bpy.context.collection.objects.link(obj)
        data.materials.append(bpy.data.materials[item['material']])
        if item['uvs']:
            uv=data.uv_layers.new()
            for loop in data.loops: uv.data[loop.index].uv=item['uvs'][loop.vertex_index]
        for polygon in data.polygons: polygon.use_smooth=True
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=16
scene.render.resolution_x=700
scene.render.resolution_y=700
scene.render.resolution_percentage=100
scene.world.color=(.5,.5,.5)
bpy.ops.object.camera_add(location=(1.8,-3.5,1.55))
cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,.7))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO'
cam.data.ortho_scale=1.8
scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(1,-3,3))
bpy.context.object.data.energy=450
bpy.context.object.data.shape='DISK'
bpy.context.object.data.size=4
scene.render.filepath=str(Path(__file__).resolve().parents[1]/('docs/swim-seated-preview.png' if seated else 'docs/swim-preview.png'))
bpy.ops.render.render(write_still=True)
