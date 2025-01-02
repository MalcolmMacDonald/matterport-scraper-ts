//dam url https://cdn-1.matterport.com/models/3d80ea3fe9754bf29753d0e261e45716/assets/~/44ba366bee9c4760a71f73074d946456_50k.dam?t=2-2841d51432a8d4cdf861aadfc5e0104e385f1030-1616649801-0
//img url https://cdn-1.matterport.com/models/3d80ea3fe9754bf29753d0e261e45716/assets/~/44ba366bee9c4760a71f73074d946456_50k_texture_jpg_high/44ba366bee9c4760a71f73074d946456_50k_000.jpg?t=2-2841d51432a8d4cdf861aadfc5e0104e385f1030-1616649801-0&width=512&crop=1024,1024,x0,y0&imgopt=1

//https://my.matterport.com/show/?m=3MU6cJqMVfC
//oregon home https://my.matterport.com/show/?m=A18f6A8rh6e&mls=1

// load matterport url
// intercept .dam file
// extract url data from dam file
// download file and textures to StreamingAssets
// https://stackoverflow.com/questions/45941601/how-to-inspect-network-traffic-and-get-the-url-of-resource-requests


//how am i going to use node.js inside of a unity application....
//  I could make a REST API that servers the data from a heroku server??
//  Maybe package a node.js package into a .exe????
//          https://dev.to/jochemstoel/bundle-your-node-app-to-a-single-executable-for-windows-linux-and-osx-2c89
//          this seems to work


//window.MP_PREFETCHED_MODELDATA

//queries -> GetModelPrefetch -> data -> model -> name


//TODO:
//delete zipped folder after

const fs = require('fs');

const scraper = require('./matterport-scraper');
const utility = require('./utility-functions');
const scanURL = process.argv[2];
const config = require('./config');
const options = process.argv[2];
const archiver = require('archiver');


run();


/*async function run() {
    switch (options){
        case '-a':
            const allURLS = getAllCurrentURLS();
            for (var i = 0; i < allURLS.length; i++) {
                await downloadScan(allURLS[i]);
            }
            console.log("Downloaded All Scans")
            process.exit();
            break;
        case '-data':
            console.log(await scraper.getScanModel(scanURL));
            process.exit();
            break;
        default:

            process.exit();
            break;
    }
}*/


function getAllCurrentURLS() {
    const allDirectories = fs.readdirSync(config.outputLocation, {withFileTypes: true}).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
    var allURLS = [];
    for (var i = 0; i < allDirectories.length; i++) {
        const contentsPath = config.outputLocation + allDirectories[i] + "/Contents.json";
        const contentsJson = JSON.parse(fs.readFileSync(contentsPath));
        allURLS.push(contentsJson.URL);
    }
    return allURLS;
}

module.exports = {}


