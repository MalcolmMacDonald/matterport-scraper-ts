import type {ModelData} from "../matterport/model-data.ts";
import fs from "fs";

export async function getPreviewImage(model: ModelData, outputPath: string) {
    const image = await fetch(model.image.url);
    const modelImageName = model.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const buffer = await image.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
}