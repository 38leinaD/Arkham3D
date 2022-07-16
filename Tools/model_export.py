"""
model_export.py

Created by Daniel Platz on 2012-06-14.
Copyright (c) 2012 Fruitfly. All rights reserved.
"""

import bpy
from mathutils import Euler
import os
import struct
import math
import datetime

# Creates a copy of an object.
# Returns the copy.
# Needs to be called from OBJECT-mode.
def copyObject(obj):
    obj.select = True
    bpy.ops.object.duplicate()
    # Duplicate is automatically selected
    return bpy.context.selected_objects[0]
    
# Deletes an object.
# Needs to be called from OBJECT-mode.
def deleteObject(obj):
    bpy.context.scene.objects.unlink(obj)
    bpy.data.objects.remove(obj)

# Triangulates a mesh.
# Needs to be called from OBJECT-mode.
def triangulateObject(obj):
    obj.select = True
    bpy.context.scene.objects.active = obj

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.quads_convert_to_tris()
    bpy.ops.object.mode_set(mode='OBJECT')
    
# Adjust the orientation of an object for OpenGL.
# Needs to be called from OBJECT-mode.
def adjustToOpenGLCoordinates(obj):
    obj.rotation_euler = Euler((0.0, math.pi/2, -math.pi/2), 'XYZ')
    bpy.ops.object.transform_apply(rotation=True)
    
class Exporter ():
    def __init__(self):
        #self.file = None
        #self.scene = None
        pass
           
    def exportObject(self, originalObject):
        object = copyObject(originalObject)
        mesh = None
        try:
            triangulateObject(object)
            mesh = object.to_mesh(bpy.context.scene, True, 'PREVIEW')
            
            self.file.write('{\n')

            self.file.write('  "name": "' + originalObject.name + '",\n')
            
            self.file.write('  "data": [')

            texture = mesh.materials['Material'].texture_slots[0].texture
            #self.file.write(".tex " + texture.image.filepath.replace('//', '') + "\n")
            
            for (polygonId, polygon) in enumerate(mesh.polygons):
                if len(polygon.vertices) != 3:
                    print("Polygon has " + str(len(polygon.vertices)) + " vertices. Ignoring it.\n")
                    continue
                for (index, vertexId) in enumerate(polygon.vertices):
                    coords = mesh.vertices[vertexId].co
                    worldCoords = object.matrix_world * coords
                    self.file.write(str(worldCoords[0]) + ", " + str(worldCoords[1]) + ", " + str(worldCoords[2]))
                    # nromal
                    normal = polygon.normal;
                    #self.file.write(", " + str(normal[0]) + ", " + str(normal[1]) + ", " + str(normal[2]))    

                    uv = (mesh.tessface_uv_textures.active.data[polygonId].uv_raw[index * 2], mesh.tessface_uv_textures.active.data[polygonId].uv_raw[index * 2 + 1])
                    self.file.write(", " + str(uv[0]) + ", " + str(uv[1]))   

                    if not (polygonId == len(mesh.polygons)-1 and index == 2) : self.file.write(",\n")   


            self.file.write(']\n')
            self.file.write("}\n") 
                
        finally:
            if object != None: 
                print("Deleting temporary object for " + object.name)
                deleteObject(object)
        
    def export(self, scene):
        self.scene = scene

        try:
            self.file = open(os.path.expanduser("C:/Users/daniel.platz/Dropbox/Dev/Web/ProjectEdinburgh/Game/assets/models/grave.mdl"), mode="w")
            
            now = datetime.datetime.now()
            
            #self.file.write("//" + ("//"*80) + "\n")
            #self.file.write("// Model " + bpy.data.filepath + "\n")
            #self.file.write("// Created by Daniel Platz on " + now.strftime("%Y-%m-%d %H:%M") + "\n")
            #self.file.write("// Exported with Blender Version " + str(bpy.app.version) +  "\n")
            #self.file.write("// Copyright (c) " + now.strftime("%Y") + " Fruitfly. All rights reserved." + "\n")
            #self.file.write("//" + ("//"*80) + "\n")
            
            for object in self.scene.objects:
                if object.type != "MESH": continue
                self.exportObject(object)
                break
            
            print("====================================================")
            print("Export finished!")
            print("====================================================")
        finally:
            self.file.close()
    
def main():
    exporter = Exporter()
    exporter.export(bpy.data.scenes[0])

if __name__ == '__main__':
    main()

