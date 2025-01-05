//create a json with extra data about the scanned model
import type {ModelData} from "../matterport/model-data.ts";
import fs from 'fs';

export async function downloadContents(modelData: ModelData, targetDirectory: string, targetPath: string) {
    console.log("Downloading contents.json");
    console.time("Contents.json");
    let fileSize = 0;

    function getFileSize(filePath: string) {
        return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    }
    

    function getDirectorySize(directoryPath: string) {
        let size = 0;
        if (!fs.existsSync(directoryPath)) {
            return size;
        }
        const paths = fs.readdirSync(directoryPath, {withFileTypes: true});
        paths.forEach((path) => {
            size += fs.statSync(`${directoryPath}/${path.name}`).size;
        });
        return size;
    }

    fileSize += getDirectorySize(`${targetDirectory}/Textures`);
    fileSize += getDirectorySize(`${targetDirectory}/Panoramas`);
    fileSize += getFileSize(`${targetDirectory}/ModelData.json`);
    fileSize += getFileSize(`${targetDirectory}/Model.obj`);
    fileSize += getFileSize(`${targetDirectory}/PreviewImage.jpg`);


    const contents = {
        name: modelData.name,
        modelID: modelData.id,
        spawnPoint: {
            position: modelData.image.snapshotLocation.position,
            rotation: modelData.image.snapshotLocation.rotation
        },
        size: fileSize
    };
    if (fs.existsSync(`${targetDirectory}/Textures`)) {
        contents['texturePaths'] = fs.readdirSync(`${targetDirectory}/Textures`, {withFileTypes: true}).map((texturePath) => `./Textures/${texturePath.name}`);
    }
    if (fs.existsSync(`${targetDirectory}/Panoramas`)) {
        contents['panoramaPaths'] = fs.readdirSync(`${targetDirectory}/Panoramas`, {withFileTypes: true}).map((panoramaPath) => `./Panoramas/${panoramaPath.name}`);
    }

    fs.writeFileSync(targetPath, JSON.stringify(contents, null, 2));
    console.timeEnd("Contents.json");
    console.log(`Total Size: ${(fileSize / 1048576).toFixed(2)} mb`);
}