'use strict';

const fs = require('fs').promises;
const path = require('path');
const {URL} = require('url');

const SlackLib = require('../slack_lib');

const commands = {};
const handlers = [];

const init = async function () {
    const entries = await fs.readdir(__dirname, {
        withFileTypes: true,
    });
    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'index.js') {
            const {command, handler} = require(`./${entry.name}`);
            const name = path.basename(entry.name, '.js');
            commands[name] = command;
            if (handler) {
                console.log('adding handler from', name, handler)
                handlers.push(handler);
            }
        }
    }
};

const run = async function (command, options) {
    if (!commands.hasOwnProperty(command)) {
        throw new Error('NoSuchCommand');
    }
    return commands[command](options);
};

const sendResponse = async function (obj, response_url) {
    return request({url: response_url, body: obj, json: true, method: 'POST'});
};

const sendErrorResponse = async function (err, response_url) {
    return sendResponse({text: err}, response_url);
};

const topic_url_re = /<(http:[^>]*)>/;
const slackCommand = async function (req, res, next) {
    const url = new URL(req.url, 'https://warfish.chadshost.xyz');
    const command_name = path.basename(url.pathname);
    if (!commands.hasOwnProperty(command_name)) {
        return next(new Error('NoSuchCommand'));
    }
    res.end();
    const args = req.body.text.split(' ');
    const response_url = req.body.response_url;
    const channel_id = req.body.channel_id;
    const topic = await SlackLib.getChannelTopic(channel_id);
    const match = topic.match(topic_url_re);
    const game_url = new URL(match[1].replace(/&amp;/g, '&'));
    const game_id = game_url.searchParams.get('gid');
    const min_units = game_url.searchParams.get('min');
    const territories_per_unit = game_url.searchParams.get('per');

    let object;
    try {
        object = await run(command_name, {game_id, min_units, territories_per_unit, args});
    } catch (err) {
        console.error('error running command', command_name, 'with args', args, err);
        sendErrorResponse('Error running command', response_url);
        return;
    }
    sendResponse(object, response_url);
};

const getMiddleWare = function () {
    return [...handlers, slackCommand];
};

module.exports = {init, run, getMiddleWare};
