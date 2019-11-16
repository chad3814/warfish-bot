'use strict';

const {buildSchema} = require('graphql');

const {getMap} = require('./map');

const schema = buildSchema(`
  type Query {
    map(game_id: Int): String
  }
`);

const root = {
    map: async (args) => {
        const map = await getMap(args.game_id);
        return map.getBase64Async(Jimp.MIME_PNG);
    },
};

module.exports = {schema, root};
