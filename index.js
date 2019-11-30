'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');

const {schema, root} = require('./lib/graphql');

const SlackCommands = require('./lib/slack-commands');

const main = async function () {
    await SlackCommands.init();

    const app = express();

    app.use('/graphql', graphqlHTTP({
        schema,
        rootValue: root,
        graphiql: true,
    }));

    app.use('/slack', SlackCommands.getMiddleWare());

    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');  
};

main();