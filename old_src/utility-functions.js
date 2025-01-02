const config = require('./config')
const fs = require("fs");

module.exports = {

    prepareScanFolder(model, override) {
        const dirInfo = fs.readdirSync(config.outputLocation, {withFileTypes: true});
        const folders = dirInfo.filter(dirent => dirent.isDirectory());
        const folderNames = folders.map(folder => folder.name);
        const newFolderName = model.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

        var folderExists = folderNames.some(folderName => folderName === newFolderName);
        if (override && folderExists) {
            fs.rmdirSync(this.getScanAssetPath(model, ""), ({recursive: true}));
            folderExists = false;
        }
        if (!folderExists) {
            fs.mkdirSync(this.getScanAssetPath(model, ""));
        }
    },

    getScanAssetPath(model, assetName) {
        const modelFolderName = model.name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        return `${config.outputLocation}${modelFolderName}/${assetName}`;
    },

    buildOBJ(model, obj) {

        var objFileText = "";

        var totalVerts = 0;
        var totalUVs = 0;
        var chunkCount = 0;
        if (!model.size) {
            model.size = 0;
        }
        obj.chunk.forEach(chunk => {
            var materialName = chunk.material_name.split(".")[0];
            objFileText += `g ${materialName} \n`;
            var vertices = [];
            var uvs = [];
            var faceIndices = [];
            var uvIndices = [];
            var materialIndex = chunk.material_name.split('_');
            materialIndex = materialIndex[materialIndex.length - 1];
            materialIndex = materialIndex.split('.')[0];
            materialIndex = parseInt(materialIndex);

            chunk.vertices.xyz.forEach(vert => vertices.push(vert));
            chunk.vertices.uv.forEach(uv => uvs.push(uv));

            chunk.faces.faces.forEach(face => {
                faceIndices.push(face + totalVerts + 1);
                uvIndices.push(face + totalUVs + 1);
            });

            totalVerts += chunk.vertices.xyz.length / 3;
            totalUVs += (chunk.vertices.xyz.length / 3);
            chunkCount++;
            for (var j = 0; j < vertices.length; j += 3) {
                var thisString = `v ${-vertices[j]} ${vertices[j + 2]} ${vertices[j + 1]}\n`;
                objFileText += thisString;
            }
            for (var j = 0; j < uvs.length; j += 2) {
                var thisString = `vt ${uvs[j]} ${uvs[j + 1]}\n`;
                objFileText += thisString;
            }

            for (var j = 0; j < faceIndices.length; j += 3) {
                var thisString = `f ${faceIndices[j]}/${uvIndices[j]} ${faceIndices[j + 1]}/${uvIndices[j + 1]} ${faceIndices[j + 2]}/${uvIndices[j + 2]}\n`;
                objFileText += thisString;
            }
        });

        var objPath = this.getScanAssetPath(model, "Model.obj");
        fs.writeFileSync(objPath, objFileText, {options: 'w'});
        model.size += fs.lstatSync(objPath).size;

        console.log("Completed Building OBJ");
    },
    /**
     * @param {String} sourceDir: /some/folder/to/compress
     * @param {String} outPath: /path/to/created.zip
     * @returns {Promise}
     */
    zipDirectory(sourceDir, outPath, internalDirectory) {
        const archive = archiver('zip', {zlib: {level: 9}});
        const stream = fs.createWriteStream(outPath);

        return new Promise((resolve, reject) => {
            archive
                .directory(sourceDir, internalDirectory)
                .on('error', err => reject(err))
                .pipe(stream)
            ;

            stream.on('close', () => resolve());
            archive.finalize();
        });
    }

}