import fs from "fs";
import {Jimp} from "jimp";
import type {ModelData, TextureQuality} from "../matterport/model-data.ts";

const textureScale = 1;
const textureSize = 2048;
const textureQuality: TextureQuality = "high";
const textureChunkSize = 512;

export async function downloadTextures(model: ModelData, texturesDirectory: string) {

    console.log("Downloading textures");
    console.time("Textures")

    if (fs.existsSync(texturesDirectory)) {
        fs.rmdirSync(texturesDirectory, {recursive: true});
    }
    fs.mkdirSync(texturesDirectory);
    let materialIndex = 0;
    const urlTemplate = model.assets.textures.find(texture => texture.quality == textureQuality)?.urlTemplate as string;
    const assetID = urlTemplate.split('?')[0].split('/').slice(-1)[0].split('_')[0];
    const stitchedTexturePromises = [];
    while (true) {
        const materialIndexText = materialIndex.toString().padStart(3, '0');
        const fileName = `${assetID}_50k_${materialIndex}`;
        const finalFilePath = `${texturesDirectory}/${fileName}`;
        const url = urlTemplate.replace('<texture>', materialIndexText);
        const testURL = url + `&crop=${textureChunkSize},${textureChunkSize},x0,y0&imgopt=1`;
        const responseCode = await fetch(testURL, {method: 'HEAD'}).then(response => response.status);
        if (responseCode != 200) {
            break;
        }
        stitchedTexturePromises.push(downloadStitchedTexture(materialIndexText, url, finalFilePath));
        materialIndex++;
    }
    await Promise.all(stitchedTexturePromises);
    console.timeEnd("Textures");
}


async function downloadStitchedTexture(materialIndex: string, url: string, filePath: string) {
    const image = new Jimp({width: textureSize * textureScale, height: textureSize * textureScale});
    const textureStepSize = textureChunkSize / textureSize;
    const promises = [];

    for (let x = 0; x < 1; x += textureStepSize) {
        for (let y = 0; y < 1; y += textureStepSize) {
            const newURL = url + `&crop=${textureChunkSize},${textureChunkSize},x${x},y${y}&imgopt=1`;
            promises.push(blitTextureChunk(image, x, y, newURL));
        }
    }
    await Promise.all(promises);
    await image.write(`${filePath}.png`);
}

async function blitTextureChunk(fullImage, x, y, imageURL) {


    const jimpImage = await Jimp.read(imageURL);
    jimpImage.scale(textureScale);
    const newX = x * textureSize * textureScale;
    const newY = y * textureSize * textureScale;
    fullImage.blit({src: jimpImage, x: newX, y: newY});
}
