import type {Page} from "puppeteer";
import {Browser} from "puppeteer";
import {ModelData} from "./model-data.ts";

const PuppeteerExtra = require("puppeteer-extra");

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
        await this.page.goto(this.url);
        this.modelData = await this.page.evaluate(() => (window["MP_PREFETCHED_MODELDATA"].queries.GetModelPrefetch.data.model) as ModelData);
    }

    async close() {
        await this.page.close();
        await this.browser.close();
    }
}