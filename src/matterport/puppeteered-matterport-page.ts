import type {Page} from "puppeteer";
import {Browser, HTTPResponse} from "puppeteer";
import {Mesh, ModelData, Texture} from "./model-data.ts";

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

    async validateMeshes(inputMeshes: Mesh[]) {
        let validMeshes = [];
        for (let mesh of inputMeshes) {
            let response = await fetch(mesh.url);
            if (response.status === 200) {
                validMeshes.push(mesh);
            }
        }
        return validMeshes;
    }

    async validateTextures(inputTextures: Texture[]) {
        let validTextures = [];
        for (let texture of inputTextures) {
            let response = await fetch(texture.urlTemplate.replace('<texture>', '000'));
            if (response.status === 200) {
                validTextures.push(texture);
            }
        }
        return validTextures;
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
        let validMeshes = await this.validateMeshes(allMeshes);
        let validTextures = await this.validateTextures(prefetchedModelData.assets.textures);
        if (validMeshes.length === 0) {
            const foundResponse = await modelDetailsPromise;
            const liveModelData = JSON.parse((await foundResponse.buffer()).toString()).data.model as ModelData;
            validMeshes = await this.validateMeshes(liveModelData.assets.meshes);
            validTextures = await this.validateTextures(liveModelData.assets.textures);
        }
        abortController.abort();
        prefetchedModelData.assets.meshes = validMeshes;
        prefetchedModelData.assets.textures = validTextures;
        this.modelData = prefetchedModelData;
    }

    async close() {
        await this.page.close();
        await this.browser.close();
    }
}