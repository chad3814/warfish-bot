'use strict';

const fs = require('fs');
const pfs = fs.promises;
const path = require('path');
const {URL} = require('url');

const {getMap} = require('../map');

const previous_map_pathnames = [];

const command = async function (options) {
    const now = Math.floor(Date.now() / 1000);
    const minute_time = now - (now % 60);
    const map_pathname = path.join('/tmp', 'img', `map${minute_time}.png`);
    const map_url = `https://warfish.chadshost.xyz/img/map${minute_time}.png`;
    const obj = {
        blocks: [{
            type: 'image',
            image_url: map_url,
            alt_text: 'Current Game Board',
        }],
    };
    if (options.args[0] !== 'me') {
        obj.response_type = 'in_channel';
    }
    try {
        if (await pfs.access(map_pathname)) {
            return obj;
        }
    } catch (err) {
        // ignore
    }
    const map = await getMap(options.game_id);
    map.write(map_pathname);
    previous_map_pathnames.push(map_pathname);
    while (previous_map_pathnames.length > 25) {
        const pathname = previous_map_pathnames.shift();
        await pfs.unlink(pathname);
    }
    return obj;
};

const handler = async function (req, res, next) {
    const url = new URL(req.url, 'https://warfish.chadshost.xyz');
    if (!url.pathname.toString().startsWith('/img/')) {
        return next();
    }
    const pathname = path.join('/tmp', url.pathname);
    try {
        await pfs.access(pathname);
    } catch (err) {
        res.status = 404;
        return res.end();
    }
    const file = fs.createReadStream(pathname);
    file.pipe(res);
};

module.exports = {command, handler};
