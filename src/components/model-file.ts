import type {MeshResolution, ModelData} from "../model-data.ts";
import Pbf from "pbf";

const damProto = require('../damProto.js').DAMFile;
const fs = require('fs');


function buildOBJ(model: ModelData, obj, outputData) {

    var objFileText = "";

    var totalVerts = 0;
    var totalUVs = 0;
    var chunkCount = 0;
    if (!outputData.size) {
        outputData.size = 0;
    }
    obj.chunk.forEach(chunk => {
        var materialName = chunk.material_name.split(".")[0];
        objFileText += `g ${materialName} \n`;
        var vertices = [];
        var uvs = [];
        var faceIndices = [];
        var uvIndices = [];
        var materialIndex = chunk.material_name.split('_');
        materialIndex = materialIndex[materialIndex.length - 1];
        materialIndex = materialIndex.split('.')[0];
        materialIndex = parseInt(materialIndex);

        chunk.vertices.xyz.forEach(vert => vertices.push(vert));
        chunk.vertices.uv.forEach(uv => uvs.push(uv));

        chunk.faces.faces.forEach(face => {
            faceIndices.push(face + totalVerts + 1);
            uvIndices.push(face + totalUVs + 1);
        });

        totalVerts += chunk.vertices.xyz.length / 3;
        totalUVs += (chunk.vertices.xyz.length / 3);
        chunkCount++;
        for (var j = 0; j < vertices.length; j += 3) {
            var thisString = `v ${-vertices[j]} ${vertices[j + 2]} ${vertices[j + 1]}\n`;
            objFileText += thisString;
        }
        for (var j = 0; j < uvs.length; j += 2) {
            var thisString = `vt ${uvs[j]} ${uvs[j + 1]}\n`;
            objFileText += thisString;
        }

        for (var j = 0; j < faceIndices.length; j += 3) {
            var thisString = `f ${faceIndices[j]}/${uvIndices[j]} ${faceIndices[j + 1]}/${uvIndices[j + 1]} ${faceIndices[j + 2]}/${uvIndices[j + 2]}\n`;
            objFileText += thisString;
        }
    });

    return objFileText;
}

export async function downloadOBJ(modelData: ModelData, outputData: any, path: string) {
    const meshResolution: MeshResolution = "50k";

    const meshIndex = modelData.assets.meshes.findIndex(mesh => mesh.resolution === meshResolution);

    const mesh = modelData.assets.meshes[meshIndex];
    const response: Response = await fetch(mesh.url);
    const buffer = await response.arrayBuffer();
    const foundPbf = new Pbf(buffer);
    const obj: any = damProto.read(foundPbf);
    const objFileText: string = buildOBJ(modelData, obj, outputData);
    fs.writeFileSync(path, objFileText);
}
