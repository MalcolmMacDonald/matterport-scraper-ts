import type {Page} from "puppeteer";
import {Browser, HTTPResponse} from "puppeteer";
import {ModelData} from "./model-data.ts";

const PuppeteerExtra = require("puppeteer-extra");
const modelDataURLPrefix = "https://my.matterport.com/api/mp/models/graph?operationName=GetModelDetails";

export class PuppeteeredMatterportPage {
    modelData: ModelData;
    private readonly url: string;
    private browser: Browser;
    private page: Page;

    constructor(url: string) {
        this.url = url;

    }

    async initialize() {
        this.browser = await PuppeteerExtra.launch({
            "headless": true
        });
        this.page = await this.browser.newPage();
        let modelDetailsPromise: Promise<HTTPResponse>;
        let abortController = new AbortController();
        modelDetailsPromise = this.page.waitForResponse(response => response.url().startsWith(modelDataURLPrefix), {
            timeout: 2500,
            signal: abortController.signal
        });
        modelDetailsPromise.catch(() => {
        });
        await this.page.goto(this.url);

        let prefetchedModelData = await this.page.evaluate(() => (window["MP_PREFETCHED_MODELDATA"].queries.GetModelPrefetch.data.model) as ModelData);

        let allMeshes = prefetchedModelData.assets.meshes;
        let validMeshes = [];
        for (let mesh of allMeshes) {
            let response = await fetch(mesh.url);
            if (response.status === 200) {
                validMeshes.push(mesh);
            }
        }
        if (validMeshes.length === 0) {
            const foundResponse = await modelDetailsPromise;
            const liveModelData = JSON.parse((await foundResponse.buffer()).toString()) as ModelData;
            validMeshes = liveModelData.assets.meshes;
        }
        abortController.abort();
        prefetchedModelData.assets.meshes = validMeshes;
        let meshQualities = prefetchedModelData.assets.meshes.map(mesh => mesh.resolution);
        console.log("Mesh qualities: ", meshQualities);

        this.modelData = prefetchedModelData;
    }

    /*    interceptRequest(interceptedRequest: EventsWithWildcard<PageEvents>["request"]) {
            if (interceptedRequest.url().startsWith(modelDataURLPrefix)) {
                const interceptedData = interceptedRequest.url();
                fetch(interceptedData).then(response => response.json()).then(data => {
                    this.modelData = data.data.model;
                    console.log("Model data loaded");
                });
            }
        }*/

    async close() {
        await this.page.close();
        await this.browser.close();
    }
}