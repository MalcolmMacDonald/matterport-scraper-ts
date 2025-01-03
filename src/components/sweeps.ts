import type {ModelData} from "../matterport/model-data.ts";
import fs from "fs";

export async function getSweeps(model: ModelData, outputPath: string) {
    var sweepURL = `https://my.matterport.com/api/v2/models/${model.id}/sweeps?tag=showcase`;
    const response = await fetch(sweepURL);
    const sweepJSON = await response.json();
    var positions = [];
    for (var i = 0; i < sweepJSON.length; i++) {
        if (sweepJSON[i].room_index == -1) {
            continue;
        }
        var position = sweepJSON[i].position;
        var rotation = sweepJSON[i].rotation;
        var uuid = sweepJSON[i].sweep_uuid.replace(/-/g, '');
        positions.push({position, rotation, uuid});
    }
    fs.writeFileSync(outputPath, JSON.stringify(positions, null, 2));
}