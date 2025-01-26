import type {MeshResolution, ModelData, TextureQuality} from "../matterport/model-data.ts";
import Pbf from "pbf"
import fs from "fs";
import {Document, NodeIO} from "@gltf-transform/core";
import {downloadStitchedTextureData} from "./textures.ts";


const nodeIO = new NodeIO();


const damProto = require("../matterport/damProto.js").DAMFile;
const meshResolution: MeshResolution = "50k";
const textureQuality: TextureQuality = "high";


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


export async function downloadGLTF(modelData: ModelData, path: string) {
    console.time("GLTF");
    const mesh = modelData.assets.meshes.find(mesh => mesh.resolution === meshResolution);
    const urlTemplate = modelData.assets.textures.find(texture => texture.quality == textureQuality)?.urlTemplate!;

    if (!mesh) {
        throw new Error(`Could not find mesh with resolution ${meshResolution}`);
    }
    const response: Response = await fetch(mesh.url);
    const buffer = await response.arrayBuffer();
    const foundPbf = new Pbf(buffer);
    const pbf: unknown = damProto.read(foundPbf);

    const gltf = await buildGLTF(pbf, urlTemplate);
    await nodeIO.write(path, gltf);
    console.timeEnd("GLTF");
}

function remapVerticesAxes(vertices: number[]): number[] {
    const remappedVertices = [];
    for (let i = 0; i < vertices.length; i += 3) {
        remappedVertices.push(-vertices[i], vertices[i + 2], vertices[i + 1]);
    }
    return remappedVertices;
}

function remapUVAxes(uvs: number[]): number[] {
    const remappedUVs = [];
    for (let i = 0; i < uvs.length; i += 2) {
        remappedUVs.push(uvs[i], 1 - uvs[i + 1]);
    }
    return remappedUVs;
}

async function buildGLTF(pbf, urlTemplate: string): Promise<Document> {
    const doc = new Document();
    const root = doc.getRoot();
    const scene = doc.createScene("default");
    const mesh = doc.createMesh("mesh");
    const node = doc.createNode("node");

    const mainBuffer = doc.createBuffer('buffer');
    const textureURLs = pbf.chunk.map(chunk => chunk.material_name);//.map(materialName => urlTemplate.replace('<texture>', materialName));
    const distinctTextureURLs = [...new Set(textureURLs)];
    const textures = [];
    const texturePromises = [];
    let textureCount = 0;
    for (const textureURL of distinctTextureURLs) {
        const materialIndex = textureURL.split('_').slice(-1)[0].split('.')[0];
        const fullTextureURL = urlTemplate.replace('<texture>', materialIndex);
        texturePromises.push(downloadStitchedTextureData(fullTextureURL).then(data => {
            return doc.createTexture(textureURL)
                .setImage(data)
                .setMimeType('image/jpeg');
        }).then(texture => {
            textures[textureURL] = texture;
            textureCount++;
            console.log(`Downloaded texture for material index ${textureCount}/${distinctTextureURLs.length}`);
        }));
    }
    await Promise.all(texturePromises);

    pbf.chunk.forEach(chunk => {
        const chunkName = chunk.chunk_name;
        const chunkMaterial = chunk.material_name;
        const material = doc.createMaterial(chunkMaterial).setBaseColorTexture(textures[chunkMaterial]);
        //console.log(chunkMaterial);
        const positionAccessor = doc.createAccessor(`${chunkName}-positions`)
            .setType('VEC3')
            .setArray(new Float32Array(remapVerticesAxes(chunk.vertices.xyz)))
            .setBuffer(mainBuffer);
        const indexAccessor = doc.createAccessor(`${chunkName}-indices`)
            .setType('SCALAR')
            .setArray(new Uint16Array(chunk.faces.faces))
            .setBuffer(mainBuffer);
        const uvAccessor = doc.createAccessor(`${chunkName}-uvs`)
            .setType('VEC2')
            .setArray(new Float32Array(remapUVAxes(chunk.vertices.uv)))
            .setBuffer(mainBuffer);

        const primitive = doc.createPrimitive()
            .setAttribute('POSITION', positionAccessor)
            .setAttribute('TEXCOORD_0', uvAccessor)
            .setIndices(indexAccessor)
            .setMaterial(material);
        mesh.addPrimitive(primitive);
    });
    scene.addChild(node);
    node.setMesh(mesh);
    return doc;
}


export async function downloadOBJ(modelData: ModelData, path: string) {
    //console.log("Downloading OBJ");
    console.time("OBJ");
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


