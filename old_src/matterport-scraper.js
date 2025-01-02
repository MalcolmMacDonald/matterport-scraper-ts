const fs = require("fs");
const jimp = require("jimp");
const config = require('./config');
const utility = require('./utility-functions');
const fetch = require("node-fetch");
const Pbf = require("pbf");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin())
const damProto = require('./damProto.js').DAMFile;


module.exports = {
    async downloadScan(urlToScan, outputLocation) {


        config.outputLocation = outputLocation;
        const modelData = await this.getScanModel(urlToScan);

        const modelFolderPath = utility.getScanAssetPath(modelData, "");
        if (!fs.existsSync(modelFolderPath)) {
            fs.mkdirSync(modelFolderPath);
        }
        var previousContents = {};
        const previousContentsPath = utility.getScanAssetPath(modelData, "Contents.json");
        if (fs.existsSync(previousContentsPath)) {
            previousContents = JSON.parse(fs.readFileSync(previousContentsPath));
            //  console.log(previousContents)
        }

        //utility.prepareScanFolder(modelData,true);
        console.log("Downloading: " + modelData.name);

        await Promise.all([

            this.downloadTextures(modelData),
            this.downloadOBJ(modelData),
            this.getSweeps(modelData),
            this.getPreviewImage(modelData),
            this.downloadPanoramas(modelData)
        ]);

        if (!config.downloadFlags.textures) {
            const texturePaths = fs.readdirSync(utility.getScanAssetPath(modelData, config.texturesFolder), {withFileTypes: true}).filter(dirent => !dirent.name.includes(".meta")).map(dirent => dirent.name);
            modelData.texturePaths = texturePaths;
        }

        if (!modelData.size && previousContents && previousContents.Size) {
            modelData.size = previousContents.Size;
        }


        console.log("Scan Size: " + (modelData.size / 1048576).toFixed(2) + "mb");
        if (config.downloadFlags.contents) {

            let contentsJSON = {
                Name: modelData.name,
                URL: urlToScan,
                Textures: modelData.texturePaths,
                Size: modelData.size,
                SpawnPoint: {
                    position: modelData.image.snapshotLocation.position,
                    rotation: modelData.image.snapshotLocation.rotation
                }
            };
            fs.writeFileSync(utility.getScanAssetPath(modelData, "Contents.json"), JSON.stringify(contentsJSON, null, 2));
        }
        console.log("Done downloading scan!");

        if (config.downloadFlags.zip) {

            const modelZipName = modelData.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

            await utility.zipDirectory(utility.getScanAssetPath(modelData, ""), config.outputLocation + modelZipName + ".zip", modelZipName);

            console.log("Zip Created");
        }

    },


    getScanModel(url) {
        console.log(url);
        return new Promise(resolve => {
            var outModel = {};
            puppeteer.launch({headless: true}).then(browser => {
                return browser.newPage();
            }).then(page => {
                page.on('console', msg => console.log('PAGE LOG:', msg.text()));
                var hasModel = false;
                var hasTextureTID = false;
                var hasPanoramaTID = false;
                /*                page.on('request', interceptedRequest => {
                
                                    if (!hasTextureTID && interceptedRequest.url().includes('_texture_jpg')) {
                                        let tempModel = {textureTID: interceptedRequest.url().split('?')[1].split('&')[0]};
                                        if (!hasTextureTID) {
                                            outModel = {...outModel, ...tempModel};
                                            hasTextureTID = true;
                                        }
                                        if (hasModel && hasPanoramaTID) {
                                            resolve(outModel);
                                        }
                                    }
                
                
                                    if (!hasPanoramaTID && interceptedRequest.url().includes('/tiles/')) {
                                        let tempModel = {panoramaTID: interceptedRequest.url().split('?')[1].split('&')[0]};
                                        outModel = {...outModel, ...tempModel};
                                        hasPanoramaTID = true;
                
                                        if (hasModel && hasTextureTID) {
                                            resolve(outModel);
                                        }
                                    }
                                })*/

                page.goto(url).then(() => {
                    return page.evaluate(() => (window.MP_PREFETCHED_MODELDATA.queries.GetModelPrefetch.data.model));
                }).then(model => {


                    resolve(model);
                });
            });
        });
    },

    downloadTextures(model) {
        return new Promise(async resolve => {

            if (!config.downloadFlags.textures) {
                resolve();
                return;
            }
            console.time("Textures")

            const texturesFolderPath = utility.getScanAssetPath(model, config.texturesFolder);
            if (fs.existsSync(texturesFolderPath)) {
                fs.rmdirSync(texturesFolderPath, {recursive: true});
            }

            var material = 0;
            var materialIsValid = true;
            const currentQuality = config.textureResolution;
            const textureIndex = model.assets.textures.findIndex(texture => texture.quality == currentQuality);

            var urlTemplate = model.assets.textures[textureIndex].urlTemplate;

            const textureStepSize = config.textureChunkSize / config.textureSize;

            //const invalidTID = urlTemplate.split('?')[1].split('&')[0];
            //urlTemplate = urlTemplate.replace(invalidTID, model.textureTID);

            const assetID = urlTemplate.split('?')[0].split('/').slice(-1)[0].split('_')[0];

            if (!model.size) {
                model.size = 0;
            }
            if (!model.texturePaths) {
                model.texturePaths = [];
            }

            while (materialIsValid) {
                var image = new jimp(config.textureSize * config.textureScale, config.textureSize * config.textureScale);
                var fileCount = 0;
                var materialIndex = material.toString().padStart(3, '0');
                var promises = [];
                for (var x = 0; x < 1; x += textureStepSize) {
                    for (var y = 0; y < 1; y += textureStepSize) {
                        var newURL = urlTemplate.replace('<texture>', materialIndex) + `&crop=${config.textureChunkSize},${config.textureChunkSize},x${x},y${y}&imgopt=1`;

                        fileCount++;
                        promises.push(this.downloadTexture(image, x, y, newURL).then(null,
                            () => {
                                materialIsValid = false;
                            }));
                    }
                }
                await Promise.all(promises);
                if (!materialIsValid) {
                    resolve();
                    break;
                }
                var fileName = `${assetID}_50k_${materialIndex}.png`;
                var finalFilePath = utility.getScanAssetPath(model, `${config.texturesFolder}/${fileName}`);
                image.write(finalFilePath);
                model.texturePaths.push(fileName);

                material++;
            }
            for (var i = 0; i < model.texturePaths.length; i++) {
                var fileSize = fs.lstatSync(utility.getScanAssetPath(model, `${config.texturesFolder}/${model.texturePaths[i]}`));
                model.size += fileSize.size;
            }
            console.log("Completed downloading textures");
            console.timeEnd("Textures");
        });
    },


    downloadOBJ(model) {
        return new Promise(resolve => {
            if (!config.downloadFlags.mesh) {
                resolve();
                return;
            }

            const meshIndex = model.assets.meshes.findIndex(mesh => mesh.resolution === config.meshResolution);
            fetch(model.assets.meshes[meshIndex].url).then(response => {
                return response.buffer();
            }).then(buffer => {
                var pbf = new Pbf(buffer);
                var obj = damProto.read(pbf);
                utility.buildOBJ(model, obj);
                resolve();
            })
        });
    },
    getSweeps(model) {
        return new Promise(resolve => {

            if (!config.downloadFlags.sweeps) {
                resolve();
                return;
            }

            var sweepURL = `https://my.matterport.com/api/v2/models/${model.id}/sweeps?tag=showcase`;
            fetch(sweepURL)
                .then(async response => await response.buffer())
                .then(buffer => {
                    return JSON.parse(buffer);
                })
                .then(sweepJSON => {
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
                    fs.writeFileSync(utility.getScanAssetPath(model, "SweepData.json"), JSON.stringify(positions, null, 2));
                    console.log("Extracted sweep positions");
                    resolve();
                });
        });
    },
    getPreviewImage(model) {
        return new Promise((resolve, reject) => {

            if (!config.downloadFlags.previewImage) {
                resolve();
                return;
            }

            fetch(model.image.url).then(response => {
                if (response.status === 403) {
                    reject();
                    return;
                }
                response.buffer().then(buffer => {
                    const modelImageName = model.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                    fs.writeFileSync(config.outputLocation + modelImageName + ".jpg", buffer);
                    resolve();
                });

            });
        });
    },
    downloadPanoramas(model) {


        return new Promise(async resolve => {

            if (!config.downloadFlags.panoramas) {
                resolve();
                return;
            }
            console.time("Panoramas")

            const panoramaTexturesFolderPath = utility.getScanAssetPath(model, config.texturesFolder);
            if (fs.existsSync(panoramaTexturesFolderPath)) {
                fs.rmdirSync(panoramaTexturesFolderPath, {recursive: true});
            }
            const scanID = model.id;
            const locations = model.locations;

            let texturePromises = [];
            for (var sweepIndex = 0; sweepIndex < locations.length; sweepIndex++) {
                let promises = [];

                let image = new jimp(config.panoramaSize * 4, config.panoramaSize * 3);
                let fileCount = 0;
                let location = locations[sweepIndex].pano;
                let UUID = location.sweepUuid.replace(/-/g, '');

                const currentResolution = config.panoramaResolution;
                const textureIndex = location.skyboxes.findIndex(skybox => skybox.resolution == currentResolution);

                let urlTemplate = location.skyboxes[textureIndex].tileUrlTemplate;
                const invalidTID = urlTemplate.split('?')[1].split('&')[0];
                urlTemplate = urlTemplate.replace(invalidTID, model.panoramaTID);

                const assetID = urlTemplate.split('?')[0].split('/').slice(-1)[0].split('_')[0];

                for (var cubeMapIndex = 0; cubeMapIndex < 6; cubeMapIndex++) {
                    var newURL = urlTemplate.replace('<face>', cubeMapIndex).replace('<x>', '0').replace('<y>', '0') + `&imgopt=1`;

                    fileCount++;

                    promises.push(this.downloadCubemapTexture(image, cubeMapIndex, newURL));

                }
                texturePromises.push(Promise.all(promises).then(() => {
                    let fileName = `${UUID}.png`;
                    let finalFilePath = utility.getScanAssetPath(model, `${config.panoramaCubemapsFolder}/${fileName}`);
                    image.write(finalFilePath);
                }));
            }
            await Promise.all(texturePromises);
            console.log("Completed downloading panoramas");
            console.timeEnd("Panoramas");

            resolve();
        });
    },
    downloadCubemapTexture(image, index, imageURL) {

        var positions = [
            [config.panoramaSize, 0],
            [config.panoramaSize, config.panoramaSize],
            [config.panoramaSize * 2, config.panoramaSize],
            [config.panoramaSize * 3, config.panoramaSize],
            [0, config.panoramaSize],
            [config.panoramaSize, config.panoramaSize * 2]
        ]

        return new Promise((resolve, reject) => {
            fetch(imageURL).then(response => {
                if (response.status === 403) {
                    reject();
                    return;
                }
                response.buffer().then(buffer => {
                    jimp.create(buffer).then(jimpImage => {
                        jimpImage.scale(config.panoramaSize / 512, jimp.RESIZE_NEAREST_NEIGHBOR);
                        image.blit(jimpImage, positions[index][0], positions[index][1]);
                        resolve();
                    }).catch(() => reject());
                });
            });
        });
    },
    downloadTexture(image, x, y, imageURL) {
        return new Promise((resolve, reject) => {


            jimp.create(imageURL).then(jimpImage => {
                jimpImage.scale(config.textureScale);
                image.blit(jimpImage, x * config.textureSize * config.textureScale, y * config.textureSize * config.textureScale);
                resolve();
            }).catch(() => reject());

        });
    },
}