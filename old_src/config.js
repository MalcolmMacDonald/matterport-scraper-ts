const config = {
    texturesFolder: 'Textures',
    panoramaCubemapsFolder: 'PanoramaCubeMaps',
    textureChunkSize: 512,
    textureSize: 2048,
    textureScale: 1,
    panoramaSize: 32,
    textureResolution: 'high', //low, high
    meshResolution: '50k', //50k, 500k
    panoramaResolution: 'low', //2k, low, high
    downloadFlags: {
        mesh: true,
        textures: true,
        sweeps: true,
        panoramas: false,
        previewImage: true,
        contents: true,
        zip: false
    }
}

module.exports = config;