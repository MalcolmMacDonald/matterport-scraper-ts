import fs from "fs";
import {Jimp} from "jimp";
import type {ModelData, TextureQuality} from "../matterport/model-data.ts";
import {asyncStatusEnd, asyncStatusStart} from "../async-status.ts";

const textureScale = 1;
const textureSize = 2048;
const textureQuality: TextureQuality = "high";
const textureChunkSize = 512;

const asyncKey = 'textures';

export async function downloadTextures(model: ModelData, texturesDirectory: string) {


    asyncStatusStart(asyncKey);
    //console.log("Downloading textures");
    console.time("Textures")

    if (fs.existsSync(texturesDirectory)) {
        fs.rmdirSync(texturesDirectory, {recursive: true, force: true});
    }
    fs.mkdirSync(texturesDirectory);
    let materialIndex = 0;
    const urlTemplate = model.assets.textures.find(texture => texture.quality == textureQuality)?.urlTemplate!;
    const assetID = urlTemplate.split('?')[0].split('/').slice(-1)[0].split('_')[0];
    const batchSize = 20;
    while (true) {
        const stitchedTexturePromises = [];

        for (let i = 0; i < batchSize; i++) {
            const materialIndexText = materialIndex.toString().padStart(3, '0');
            const fileName = `${assetID}_50k_${materialIndex}`;
            const finalFilePath = `${texturesDirectory}/${fileName}`;
            const url = urlTemplate.replace('<texture>', materialIndexText);
            // const testURL = url + `&crop=${textureChunkSize},${textureChunkSize},x0,y0&imgopt=1`;
            /*        asyncStatusStart(`${asyncKey}/${materialIndexText}/statusTest`);
                    const responseCode = await fetch(testURL, {method: 'HEAD'}).then(response => response.status);
                    asyncStatusEnd(`${asyncKey}/${materialIndexText}/statusTest`);
                    if (responseCode != 200) {
                        break;
                    }
                    */
            stitchedTexturePromises.push(downloadStitchedTexture(materialIndexText, url, finalFilePath));
            materialIndex++;
        }
        const successes = await Promise.all(stitchedTexturePromises);
        if (successes.includes(false)) {
            break;
        }
    }

    console.timeEnd("Textures");
    asyncStatusEnd(asyncKey);
}


async function downloadStitchedTexture(materialIndex: string, url: string, filePath: string) {

    asyncStatusStart(`${asyncKey}/${materialIndex}`);
    const image = new Jimp({width: textureSize * textureScale, height: textureSize * textureScale});
    const textureStepSize = textureChunkSize / textureSize;
    const promises = [];

    for (let x = 0; x < 1; x += textureStepSize) {
        for (let y = 0; y < 1; y += textureStepSize) {
            const newURL = url + `&crop=${textureChunkSize},${textureChunkSize},x${x},y${y}&imgopt=1`;
            promises.push(blitTextureChunk(image, x, y, newURL, materialIndex));
        }
    }
    const results = await Promise.all(promises);
    if (results.includes(false)) {
        return false;
    }

    await image.write(`${filePath}.png`);
    asyncStatusEnd(`${asyncKey}/${materialIndex}`);
    return true;
}

async function blitTextureChunk(fullImage, x, y, imageURL, materialIndex) {
    const newX = x * textureSize * textureScale;
    const newY = y * textureSize * textureScale;
    asyncStatusStart(`${asyncKey}/${materialIndex}/${newX}_${newY}`);
    let jimpImage;
    try {
        jimpImage = await Jimp.read(imageURL);
    } catch (e) {
        asyncStatusEnd(`${asyncKey}/${materialIndex}/${newX}_${newY}`);
        return false;
    }
    jimpImage.scale(textureScale);
    fullImage.blit({src: jimpImage, x: newX, y: newY});
    asyncStatusEnd(`${asyncKey}/${materialIndex}/${newX}_${newY}`);
    return true;
}
