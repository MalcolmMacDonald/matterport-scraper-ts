import {Command} from "commander";
import {PuppeteeredMatterportPage} from "./matterport/puppeteered-matterport-page.ts";
import fs from "fs";
import {downloadOBJ} from "./components";


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

if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}
fs.writeFileSync(`${outputDirectory}/ModelData.json`, JSON.stringify(modelData, null, 2));

//await downloadOBJ(modelData, outputData, `${outputDirectory}/Model.obj`);
//await downloadTextures(modelData, `${outputDirectory}/Textures`);
//await getSweeps(modelData, `${outputDirectory}/SweepData.json`);
//await getPreviewImage(modelData, `${outputDirectory}/PreviewImage.jpg`);
//await downloadPanoramas(modelData, `${outputDirectory}/Panoramas`);


await puppeteeredMatterportPage.close();
