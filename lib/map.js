'use strict';

const Jimp = require('jimp');
const request = require('request-promise-native');
// require('request-debug')(request);

require('./jar');
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
    };

    const map = await Jimp.read(await request(options));
    maps.set(game_id, map);
    return map;
};

module.exports = {getMap};
