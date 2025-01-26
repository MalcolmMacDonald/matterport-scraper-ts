import fs from "fs";
import {Jimp, ResizeStrategy, ScaleOptions} from "jimp";
import type {ModelData, TextureQuality} from "../matterport/model-data.ts";

const panoramaSize = 32;
const panoramaResolution: TextureQuality = 'low';

/*const panoramaSize = 1024;
const panoramaResolution: TextureQuality = 'high';*/

export async function downloadPanoramas(model: ModelData, targetDirectory: string) {

    console.log("Downloading panoramas");
    console.time("Panoramas")

    if (fs.existsSync(targetDirectory)) {
        fs.rmdirSync(targetDirectory, {recursive: true, force: true});
    }
    fs.mkdirSync(targetDirectory);
    const locations = model.locations;

    const texturePromises = [];
    for (let sweepIndex = 0; sweepIndex < locations.length; sweepIndex++) {
        const promises = [];

        const image = new Jimp({width: panoramaSize * 4, height: panoramaSize * 3});
        const location = locations[sweepIndex].pano;
        const UUID = location.sweepUuid.replace(/-/g, '');

        const textureIndex = location.skyboxes.findIndex(skybox => skybox.resolution == panoramaResolution);

        const urlTemplate = location.skyboxes[textureIndex].tileUrlTemplate;

        for (let cubeMapIndex = 0; cubeMapIndex < 6; cubeMapIndex++) {
            const newURL = urlTemplate.replace('<face>', cubeMapIndex.toString()).replace('<x>', '0').replace('<y>', '0') + `&imgopt=1`;
            promises.push(downloadCubemapTexture(image, cubeMapIndex, newURL));

        }
        texturePromises.push(Promise.all(promises).then(() => {
            image.write(`${targetDirectory}/${UUID}.png`);
        }));
    }
    await Promise.all(texturePromises);
    console.timeEnd("Panoramas");
}

async function downloadCubemapTexture(image, index, imageURL) {

    const positions = [
        [panoramaSize, 0],
        [panoramaSize, panoramaSize],
        [panoramaSize * 2, panoramaSize],
        [panoramaSize * 3, panoramaSize],
        [0, panoramaSize],
        [panoramaSize, panoramaSize * 2]
    ]
    const response = await fetch(imageURL);
    if (response.status != 200) {
        return;
    }
    const buffer = await response.arrayBuffer();
    const jimpImage = await Jimp.read(buffer);
    jimpImage.scale({mode: ResizeStrategy.NEAREST_NEIGHBOR, f: panoramaSize / 512} as ScaleOptions);
    image.composite(jimpImage, positions[index][0], positions[index][1]);
}