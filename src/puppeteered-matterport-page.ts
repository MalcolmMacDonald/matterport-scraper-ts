import type {Page} from "puppeteer";
import {ModelData} from "./model-data.ts";

const PuppeteerExtra = require("puppeteer-extra");

export class PuppeteeredMatterportPage {
    url: string;
    page: Page;
    modelData: ModelData;

    constructor(url: string) {
        this.url = url;

    }

    async initialize() {
        const browser = await PuppeteerExtra.launch({
            "headless": true
        });
        this.page = await browser.newPage();
        await this.page.goto(this.url);
        this.modelData = await this.page.evaluate(() =>  (window["MP_PREFETCHED_MODELDATA"].queries.GetModelPrefetch.data.model) as ModelData);
        await browser.close();
    }

}