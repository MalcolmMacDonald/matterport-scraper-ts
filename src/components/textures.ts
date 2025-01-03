import fs from "fs";
import {Jimp} from "jimp";
import type {ModelData, TextureQuality} from "../matterport/model-data.ts";

const textureScale = 1;
const textureSize = 2048;
const textureQuality: TextureQuality = "high";
const textureChunkSize = 512;

export async function downloadTextures(model: ModelData, texturesDirectory: string) {

    /*        
    if (!config.downloadFlags.textures) {
        resolve();
        return;
    }*/
    console.time("Textures")

    if (fs.existsSync(texturesDirectory)) {
        fs.rmdirSync(texturesDirectory, {recursive: true});
    }
    fs.mkdirSync(texturesDirectory);

    let material = 0;
    let materialIsValid = true;
    let urlTemplate = model.assets.textures.find(texture => texture.quality == textureQuality)?.urlTemplate as string;
    let textureStepSize = textureChunkSize / textureSize;
    let assetID = urlTemplate.split('?')[0].split('/').slice(-1)[0].split('_')[0];
    while (materialIsValid) {
        const image = new Jimp({width: textureSize * textureScale, height: textureSize * textureScale});
        let fileCount = 0;
        const materialIndex = material.toString().padStart(3, '0');
        const promises = [];
        for (let x = 0; x < 1; x += textureStepSize) {
            for (let y = 0; y < 1; y += textureStepSize) {
                const newURL = urlTemplate.replace('<texture>', materialIndex) + `&crop=${textureChunkSize},${textureChunkSize},x${x},y${y}&imgopt=1`;

                fileCount++;
                promises.push(blitTextureChunk(image, x, y, newURL).then(null,
                    () => {
                        materialIsValid = false;
                    }));
            }
        }
        await Promise.all(promises);
        if (!materialIsValid) {
            break;
        }
        let fileName = `${assetID}_50k_${materialIndex}`;
        let finalFilePath = `${texturesDirectory}/${fileName}`;
        await image.write(`${finalFilePath}.png`);
        //model.texturePaths.push(fileName);
        material++;
    }
    /*        
    for (var i = 0; i < model.texturePaths.length; i++) {
        var fileSize = fs.lstatSync(utility.getScanAssetPath(model, `${config.texturesFolder}/${model.texturePaths[i]}`));
        model.size += fileSize.size;
    }*/
    console.log("Completed downloading textures");
    console.timeEnd("Textures");
}


async function blitTextureChunk(fullImage, x, y, imageURL) {


    //const jimpImage = await Jimp.create(imageURL);
    const jimpImage = await Jimp.read(imageURL);
    jimpImage.scale(textureScale);
    fullImage.blit(jimpImage, x * textureSize * textureScale, y * textureSize * textureScale);
}
