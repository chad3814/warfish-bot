'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');
const Jimp = require('jimp');

const getMap = require('./lib/map');

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

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000);

console.log('Running a GraphQL API server at localhost:4000/graphql');
