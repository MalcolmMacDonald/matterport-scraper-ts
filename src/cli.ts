import {Command} from "commander";
import {PuppeteeredMatterportPage} from "./matterport/puppeteered-matterport-page.ts";
import fs from "fs";
import "./components";
import {
    downloadContents,
    downloadOBJ,
    downloadPanoramas,
    downloadPreviewImage,
    downloadSweeps,
    downloadTextures
} from "./components";


const program = new Command();

program.name("matterport-scraper");
program.version("0.0.1");
program.requiredOption("-i, --input <url>", "Input URL");
program.option("-o, --output <path>", "Output directory");
program.option("-z, --zip", "Save as zip file");

program.parse(process.argv);

const options = program.opts();
//find id from url, after "?m=" and before any "&" or end of string
let id = options.input.match(/(?<=\?m=)[^&]+/)[0];
id = id.replace(/"/g, '');
console.log(`Scraping Matterport model with id ${id}`);
const outputDirectory = options.output != null ? `${options.output}/${id}` : `./${id}`;

const url = `https://my.matterport.com/show/?m=${id}`;

const puppeteeredMatterportPage = new PuppeteeredMatterportPage(url);
await puppeteeredMatterportPage.initialize();
const modelData = puppeteeredMatterportPage.modelData;

if (fs.existsSync(outputDirectory)) {
    fs.rmdirSync(outputDirectory, {recursive: true});
}

fs.mkdirSync(outputDirectory);

fs.writeFileSync(`${outputDirectory}/ModelData.json`, JSON.stringify(modelData, null, 2));

console.time("Entire scraping process");
await Promise.all([
    downloadOBJ(modelData, `${outputDirectory}/Model.obj`),
    downloadTextures(modelData, `${outputDirectory}/Textures`),
    downloadSweeps(modelData, `${outputDirectory}/SweepData.json`),
    downloadPreviewImage(modelData, `${outputDirectory}/PreviewImage.jpg`),
    downloadPanoramas(modelData, `${outputDirectory}/Panoramas`),
]);
await downloadContents(modelData, outputDirectory, `${outputDirectory}/Contents.json`);
console.log("Completed scraping Matterport model");
console.timeEnd("Entire scraping process");

await puppeteeredMatterportPage.close();
