'use strict';

const Jimp = require('jimp');
const request = require('request-promise-native');
// require('request-debug')(request);

const jar = require('./jar');
const Store = require('./store');

const maps = new Store();

const getMap = async function (game_id) {
    if (maps.has(game_id)) {
        return maps.get(game_id);
    }
    const now = Math.floor(Date.now() / 1000);
    const uri = `http://warfish.net/war/play/gamemap/${game_id}/${now}.png`;
    const options = {
        uri,
        method: 'GET',
        encoding: null,
        jar,
    };

    const map = await Jimp.read(await request(options));
    maps.set(game_id, map);
    return map;
};

const getColorIndex = async function (game_id, colors, x, y) {
    const map = await getMap(game_id);
    const index = map.getPixelIndex(x, y - 7);
    const r = map.bitmap.data[index + 0];
    const g = map.bitmap.data[index + 1];
    const b = map.bitmap.data[index + 2];
    for (const [index, color] of colors.entries()) {
        if (r === color.red && g === color.green && b === color.blue) {
            return index;
        }
    }
    return -1;
};

module.exports = {getMap, getColorIndex};
