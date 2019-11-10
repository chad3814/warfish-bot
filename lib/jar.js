'use strict';

const request = require('request');

const jar = request.jar();

if (process.env.hasOwnProperty('SESSID')) {
    const cookie = request.cookie(`SESSID=${process.env.SESSID}`);
    jar.setCookie(cookie, 'http://warfish.net/');
}

request.defaults({jar});

module.exports = jar;
