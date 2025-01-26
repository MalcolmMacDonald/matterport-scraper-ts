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

//https://cdn-2.matterport.com/models/30b5b0a5a5824f159dc9a8d246f15e53/assets/~/e411c46fe0444475b586a697159c97ad_50k_texture_jpg_high/e411c46fe0444475b586a697159c97ad_50k_014.jpg?t=2-2c4336cd411b32c54bfce37c9dae3379aa829928-1737909880-0&k=models%2F30b5b0a5a5824f159dc9a8d246f15e53%2Fassets&crop=512,512,x0.5,y0.25&imgopt=1
//https://cdn-2.matterport.com/models/30b5b0a5a5824f159dc9a8d246f15e53/assets/~/e411c46fe0444475b586a697159c97ad_50k_texture_jpg_high/e411c46fe0444475b586a697159c97ad_50k_e411c46fe0444475b586a697159c97ad_50k_000.jpg.jpg?t=2-2c4336cd411b32c54bfce37c9dae3379aa829928-1737909880-0&k=models%2F30b5b0a5a5824f159dc9a8d246f15e53%2Fassets&crop=512,512,x0,y0&imgopt=1
//https://cdn-2.matterport.com/models/30b5b0a5a5824f159dc9a8d246f15e53/assets/~/e411c46fe0444475b586a697159c97ad_50k_texture_jpg_high/e411c46fe0444475b586a697159c97ad_50k_004.jpg.jpg?t=2-2c4336cd411b32c54bfce37c9dae3379aa829928-1737909880-0&k=models%2F30b5b0a5a5824f159dc9a8d246f15e53%2Fassets&crop=512,512,x0,y0.5&imgopt=1
export async function downloadStitchedTextureData(url: string): Promise<Uint8Array> {
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
    return (await image.getBuffer('image/jpeg')) as Uint8Array;
}


async function downloadStitchedTexture(materialIndex: string, url: string, filePath: string) {

    asyncStatusStart(`${asyncKey}/${materialIndex}`);
    const image = new Jimp({width: textureSize * textureScale, height: textureSize * textureScale});
    const textureStepSize = textureChunkSize / textureSize;
    const promises = [];

    for (let x = 0; x < 1; x += textureStepSize) {
        for (let y = 0; y < 1; y += textureStepSize) {
            const newURL = url + `&crop=${textureChunkSize},${textureChunkSize},x${x},y${y}&imgopt=1`;
            console.log(newURL);

            promises.push(blitTextureChunk(image, x, y, newURL));
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

async function blitTextureChunk(fullImage, x, y, imageURL) {
    const newX = x * textureSize * textureScale;
    const newY = y * textureSize * textureScale;
    let jimpImage;
    try {
        jimpImage = await Jimp.read(imageURL);
    } catch (e) {
        return false;
    }
    jimpImage.scale(textureScale);
    fullImage.blit({src: jimpImage, x: newX, y: newY});
    return true;
}
