import fs from "fs";
import {Jimp, ResizeStrategy, ScaleOptions} from "jimp";
import type {ModelData, TextureQuality} from "../matterport/model-data.ts";

const panoramaSize = 32;
const panoramaResolution: TextureQuality = 'low';

export async function downloadPanoramas(model: ModelData, targetDirectory: string) {

    console.log("Downloading panoramas");
    console.time("Panoramas")

    if (fs.existsSync(targetDirectory)) {
        fs.rmdirSync(targetDirectory, {recursive: true});
    }
    fs.mkdirSync(targetDirectory);
    const locations = model.locations;

    let texturePromises = [];
    for (let sweepIndex = 0; sweepIndex < locations.length; sweepIndex++) {
        let promises = [];

        let image = new Jimp({width: panoramaSize * 4, height: panoramaSize * 3});
        let fileCount = 0;
        let location = locations[sweepIndex].pano;
        let UUID = location.sweepUuid.replace(/-/g, '');

        const textureIndex = location.skyboxes.findIndex(skybox => skybox.resolution == panoramaResolution);

        let urlTemplate = location.skyboxes[textureIndex].tileUrlTemplate;

        for (var cubeMapIndex = 0; cubeMapIndex < 6; cubeMapIndex++) {
            var newURL = urlTemplate.replace('<face>', cubeMapIndex.toString()).replace('<x>', '0').replace('<y>', '0') + `&imgopt=1`;

            fileCount++;

            promises.push(downloadCubemapTexture(image, cubeMapIndex, newURL));

        }
        texturePromises.push(Promise.all(promises).then(() => {
            image.write(`${targetDirectory}/${UUID}.png`);
        }));
    }
    await Promise.all(texturePromises);
    console.log("Completed downloading panoramas");
    console.timeEnd("Panoramas");
}

async function downloadCubemapTexture(image, index, imageURL) {

    var positions = [
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
    image.blit(jimpImage, positions[index][0], positions[index][1]);
}