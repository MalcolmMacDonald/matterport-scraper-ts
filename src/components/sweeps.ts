import type {ModelData} from "../matterport/model-data.ts";
import fs from "fs";

export async function downloadSweeps(model: ModelData, outputPath: string) {
    console.log("Downloading sweeps");
    console.time("Sweeps");
    const sweepURL = `https://my.matterport.com/api/v2/models/${model.id}/sweeps?tag=showcase`;
    const response = await fetch(sweepURL);
    const sweepJSON = await response.json();
    const positions = [];
    for (let i = 0; i < sweepJSON.length; i++) {
        if (sweepJSON[i].room_index == -1) {
            continue;
        }
        const position = sweepJSON[i].position;
        const rotation = sweepJSON[i].rotation;
        const uuid = sweepJSON[i].sweep_uuid.replace(/-/g, '');
        positions.push({position, rotation, uuid});
    }
    fs.writeFileSync(outputPath, JSON.stringify(positions, null, 2));
    console.timeEnd("Sweeps");
}
