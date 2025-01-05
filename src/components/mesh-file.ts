import type {MeshResolution, ModelData} from "../matterport/model-data.ts";
import Pbf from "pbf"
import fs from "fs";

import {DAMFile as damProto} from "../matterport/damProto.js";

export async function downloadOBJ(modelData: ModelData, path: string) {
    console.log("Downloading OBJ");
    console.time("OBJ");
    const meshResolution: MeshResolution = "50k";
    const mesh = modelData.assets.meshes.find(mesh => mesh.resolution === meshResolution);
    if (!mesh) {
        throw new Error(`Could not find mesh with resolution ${meshResolution}`);
    }
    const response: Response = await fetch(mesh.url);
    const buffer = await response.arrayBuffer();
    const foundPbf = new Pbf(buffer);
    const obj: unknown = damProto.read(foundPbf);
    const objFileText: string = buildOBJ(modelData, obj);
    fs.writeFileSync(path, objFileText);
    console.timeEnd("OBJ");
}



function buildOBJ(model: ModelData, obj) {

    let objFileText = "";
    let totalVerts = 0;
    let totalUVs = 0;


    obj.chunk.forEach(chunk => {
        const materialName = chunk.material_name.split(".")[0];
        objFileText += `g ${materialName} \n`;
        const vertices = [];
        const uvs = [];
        const faceIndices = [];
        const uvIndices = [];
        chunk.vertices.xyz.forEach(vert => vertices.push(vert));
        chunk.vertices.uv.forEach(uv => uvs.push(uv));

        chunk.faces.faces.forEach(face => {
            faceIndices.push(face + totalVerts + 1);
            uvIndices.push(face + totalUVs + 1);
        });

        totalVerts += chunk.vertices.xyz.length / 3;
        totalUVs += (chunk.vertices.xyz.length / 3);
        for (let j = 0; j < vertices.length; j += 3) {
            const thisString = `v ${-vertices[j]} ${vertices[j + 2]} ${vertices[j + 1]}\n`;
            objFileText += thisString;
        }
        for (let j = 0; j < uvs.length; j += 2) {
            const thisString = `vt ${uvs[j]} ${uvs[j + 1]}\n`;
            objFileText += thisString;
        }

        for (let j = 0; j < faceIndices.length; j += 3) {
            const thisString = `f ${faceIndices[j]}/${uvIndices[j]} ${faceIndices[j + 1]}/${uvIndices[j + 1]} ${faceIndices[j + 2]}/${uvIndices[j + 2]}\n`;
            objFileText += thisString;
        }
    });

    return objFileText;
}