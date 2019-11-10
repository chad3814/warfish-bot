'use strict';

const request = require('request-promise-native');

require('./jar');
const Store = require('./store');

const store = new Store();

const urls = [
    {
        _method: 'warfish.tables.getDetails',
        sections: 'board,rules,map,continents',
    },
    {
        _method: 'warfish.tables.getState',
        sections: 'cards,board,details,players',
    },
];
const base_url = 'http://warfish.net/war/services/rest';

const getData = async function (game_id) {
    if (store.has(game_id)) {
        return store.get(game_id);
    }
    const promises = urls.map(obj => {
        const qs = Object.assign({}, obj, {_format: 'json', gid: game_id});
        return request({url: base_url, qs, method: 'GET'});
    });
    const [details, state] = await Promise.all(promises);
    const data = {details: JSON.parse(details), state: JSON.parse(state)};
    store.set(game_id, data);
    return data;
};

module.exports  = getData;
