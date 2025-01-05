//create a json with extra data about the scanned model
import type {ModelData} from "../matterport/model-data.ts";
import fs from 'fs';

export async function downloadContents(modelData: ModelData, targetDirectory: string, targetPath: string) {
    console.log("Downloading contents.json");
    console.time("Contents.json");
    const texturePaths = fs.readdirSync(`${targetDirectory}/Textures`, {withFileTypes: true});
    const panoramaPaths = fs.readdirSync(`${targetDirectory}/Panoramas`);

    let fileSize = 0;
    texturePaths.forEach((texturePath) => {
        fileSize += fs.statSync(`${targetDirectory}/Textures/${texturePath.name}`).size;
    });
    panoramaPaths.forEach((panoramaPath) => {
        fileSize += fs.statSync(`${targetDirectory}/Panoramas/${panoramaPath}`).size;
    });
    fileSize += fs.statSync(`${targetDirectory}/ModelData.json`).size;
    fileSize += fs.statSync(`${targetDirectory}/Model.obj`).size;
    fileSize += fs.statSync(`${targetDirectory}/PreviewImage.jpg`).size;


    const contents = {
        name: modelData.name,
        modelID: modelData.id,
        spawnPoint: {
            position: modelData.image.snapshotLocation.position,
            rotation: modelData.image.snapshotLocation.rotation
        },
        texturePaths: texturePaths.map((texturePath) => `./Textures/${texturePath.name}`),
        panoramaPaths: panoramaPaths.map((panoramaPath) => `./Panoramas/${panoramaPath}`),
        size: fileSize
    }
    fs.writeFileSync(targetPath, JSON.stringify(contents, null, 2));
    console.timeEnd("Contents.json");
    console.log(`Total Size: ${(fileSize / 1048576).toFixed(2)} mb`);
}