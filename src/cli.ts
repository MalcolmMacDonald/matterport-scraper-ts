import {Command} from "commander";
import {PuppeteeredMatterportPage} from "./puppeteered-matterport-page.ts";
import fs from "fs";
const program = new Command();

program.name("matterport-scraper");
program.version("0.0.1");
program.option("-i, --input <url>", "Input URL");

program.parse(process.argv);

const options = program.opts();
//find id from url, after "?m=" and before any "&"
const id = options.input.match(/(?<=\?m=)(.*?)(?=&|$)/)[0];


console.log(`ID: ${id}`);

const url = `https://my.matterport.com/show/?m=${id}`;

var puppeteeredMatterportPage = new PuppeteeredMatterportPage(url);
await puppeteeredMatterportPage.initialize();
const modelData = puppeteeredMatterportPage.modelData;
console.log(modelData);


