import type {MeshResolution, ModelData} from "../matterport/model-data.ts";
import Pbf from "pbf";

const damProto = require('../matterport/damProto.js').DAMFile;
const fs = require('fs');


export async function downloadOBJ(modelData: ModelData, path: string) {
    console.log("Downloading OBJ");
    console.time("OBJ");
    const meshResolution: MeshResolution = "50k";
    const mesh = modelData.assets.meshes.find(mesh => mesh.resolution === meshResolution);
    if (!mesh) {
        throw new Error(`Could not find mesh with resolution ${meshResolution}`);
    }
    const response: Response = await fetch(mesh.url);


    /*    let promises: Promise<Response>[] = [];
        modelData.assets.meshes.forEach(mesh => {
            promises.push(fetch(mesh.url));
        });
        let responses: Response[] = await Promise.all(promises);
        let firstValidResponse: Response = responses.find(response => response.status === 200) as Response;
        if (!firstValidResponse) {
            throw new Error("Could not download mesh");
        }*/
    const buffer = await response.arrayBuffer();
    const foundPbf = new Pbf(buffer);
    const obj: any = damProto.read(foundPbf);
    const objFileText: string = buildOBJ(modelData, obj);
    fs.writeFileSync(path, objFileText);
    console.timeEnd("OBJ");
}


function buildOBJ(model: ModelData, obj) {

    var objFileText = "";

    var totalVerts = 0;
    var totalUVs = 0;
    var chunkCount = 0;

    obj.chunk.forEach(chunk => {
        var materialName = chunk.material_name.split(".")[0];
        objFileText += `g ${materialName} \n`;
        var vertices = [];
        var uvs = [];
        var faceIndices = [];
        var uvIndices = [];
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