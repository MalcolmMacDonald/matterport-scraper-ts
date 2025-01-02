import {Command} from "commander";
import {PuppeteeredMatterportPage} from "./puppeteered-matterport-page.ts";
import fs from "fs";
import {downloadOBJ} from "./components/model-file.ts";


const program = new Command();

program.name("matterport-scraper");
program.version("0.0.1");
program.requiredOption("-i, --input <url>", "Input URL");
program.option("-o, --output <path>", "Output directory");
program.option("-z, --zip", "Save as zip file");

program.parse(process.argv);

const options = program.opts();
//find id from url, after "?m=" and before any "&"
const id = options.input.match(/(?<=\?m=)(.*?)(?=&|$)/)[0];
const outputDirectory = options.output != null ? `${options.output}/${id}` : `./${id}`;
const saveAsZip = options.zip ?? false;

const url = `https://my.matterport.com/show/?m=${id}`;

var puppeteeredMatterportPage = new PuppeteeredMatterportPage(url);
await puppeteeredMatterportPage.initialize();
const modelData = puppeteeredMatterportPage.modelData;
let outputData = {};

if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}
await downloadOBJ(modelData, outputData, `${outputDirectory}/Model.obj`);




