import type {ModelData} from "../matterport/model-data.ts";
import fs from "fs";

export async function downloadPreviewImage(model: ModelData, outputPath: string) {
    console.log("Downloading preview image");
    console.time("Preview Image");
    const image = await fetch(model.image.url);
    const buffer = await image.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.timeEnd("Preview Image");
}