import json
import re
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def script_args():
    if "--" not in sys.argv:
        raise RuntimeError("Expected config, source, model output, and thumbnail output arguments")
    args = sys.argv[sys.argv.index("--") + 1 :]
    if len(args) != 4:
        raise RuntimeError(f"Expected 4 arguments, received {len(args)}")
    return [Path(value).resolve() for value in args]


def slugify(value):
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value)
    output = []
    previous_dash = False
    for character in value:
        if character.isalnum():
            output.append(character.lower())
            previous_dash = False
        elif not previous_dash:
            output.append("-")
            previous_dash = True
    return "".join(output).strip("-")


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mesh_bounds():
    points = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.visible_get():
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not points:
        raise RuntimeError("Imported file contains no visible mesh geometry")
    minimum = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maximum = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return minimum, maximum


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(name, location, energy, size, color):
    data = bpy.data.lights.new(name=name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    return obj


def render_thumbnail(destination):
    scene = bpy.context.scene
    scene.frame_set(scene.frame_start)
    minimum, maximum = mesh_bounds()
    center = (minimum + maximum) * 0.5
    extent = maximum - minimum
    radius = max(extent.length * 0.5, 0.25)

    camera_data = bpy.data.cameras.new("Lumora Preview Camera")
    camera = bpy.data.objects.new("Lumora Preview Camera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = center + Vector((1.55, -2.25, 1.35)).normalized() * radius * 3.25
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = max(extent.x, extent.y, extent.z) * 1.55
    camera_data.lens = 55
    point_at(camera, center)
    scene.camera = camera

    key = add_area_light(
        "Lumora Key",
        center + Vector((2.2, -2.6, 3.2)) * radius,
        850,
        max(radius * 2.4, 2.0),
        (1.0, 0.82, 0.62),
    )
    point_at(key, center)
    fill = add_area_light(
        "Lumora Fill",
        center + Vector((-2.5, -0.4, 1.2)) * radius,
        520,
        max(radius * 2.8, 2.0),
        (0.48, 0.67, 1.0),
    )
    point_at(fill, center)
    rim = add_area_light(
        "Lumora Rim",
        center + Vector((0.8, 2.6, 2.5)) * radius,
        680,
        max(radius * 2.0, 1.5),
        (0.76, 0.92, 1.0),
    )
    point_at(rim, center)

    world = bpy.data.worlds.new("Lumora Preview World")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.018, 0.022, 0.032, 1.0)
    background.inputs["Strength"].default_value = 0.38
    scene.world = world

    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 520
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 88
    scene.render.film_transparent = True
    scene.render.filepath = str(destination)
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.use_file_extension = True
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def convert(source, model_destination, thumbnail_destination):
    reset_scene()
    result = bpy.ops.import_scene.gltf(filepath=str(source))
    if "FINISHED" not in result:
        raise RuntimeError(f"glTF import failed: {source}")

    bpy.context.view_layer.update()
    model_destination.parent.mkdir(parents=True, exist_ok=True)
    thumbnail_destination.parent.mkdir(parents=True, exist_ok=True)

    result = bpy.ops.export_scene.gltf(
        filepath=str(model_destination),
        export_format="GLB",
        export_animations=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_yup=True,
    )
    if "FINISHED" not in result:
        raise RuntimeError(f"GLB export failed: {model_destination}")

    render_thumbnail(thumbnail_destination)


def main():
    config_path, source_root, model_root, thumbnail_root = script_args()
    config = json.loads(config_path.read_text(encoding="utf-8"))
    jobs = []
    for pack in config["packs"]:
        for relative_source in pack["models"]:
            source = source_root / pack["sourceDirectory"] / Path(relative_source)
            model_slug = slugify(Path(relative_source).stem)
            jobs.append(
                (
                    pack["slug"],
                    source,
                    model_root / pack["slug"] / f"{model_slug}.glb",
                    thumbnail_root / pack["slug"] / f"{model_slug}.webp",
                )
            )

    print(f"LUMORA_QUATERNIUS_JOBS={len(jobs)}", flush=True)
    for index, (pack_slug, source, model_destination, thumbnail_destination) in enumerate(jobs, start=1):
        if not source.is_file():
            raise FileNotFoundError(source)
        print(f"LUMORA_QUATERNIUS_CONVERT={index}/{len(jobs)} {pack_slug}/{source.name}", flush=True)
        convert(source, model_destination, thumbnail_destination)

    print(f"LUMORA_QUATERNIUS_COMPLETE={len(jobs)}", flush=True)


if __name__ == "__main__":
    main()
