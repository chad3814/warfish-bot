Warfish Bot
===========

This is a webserver that handles commands from Slack about warfish.net games.

You'll need to export a SESSID cookie as an environment variable. The code will use this cookie to access everything, so if the cookie is from a participant, it will get more than just anonymous data. The good news is you can create a dummy account and use the cookie for that. My attempt is not to have code that depends on a cookie from a participant, so it *should* not be a big deal, but..

You'll also need to export BOT_TOKEN with the bot token given from slack.

Code
----

* `index.js` - handles the web and graphql serving
* `lib/graphql.js` - setups the graphql schema and root
* `lib/jar.js` - handles setting up the cookie jar
* `lib/store.js` - a generic server-local TTL cache
* `lib/map.js` - fetches a `.png` of the board for a game
* `lib/data.js` - fetches all the JSON data available from warfish.net for a game, and converts integers into actual integers, organizes and cross references everything. 
* `lib/slack_lib.js` - utility functions related to slack
* `lib/slack-commands/` - each `.js` file in here will be mounted as a slack command, and the channel it was issued from will have the topic parsed for data that gets passed in. Each command can optionally have a `handler` that will get mounted too to serve other data
* * `.../map.js` - manages the map images stored to disk
* * `.../turn.js` - not implemented yet, will be responsible for figuring out who's turn it is
* * `.../units.js` - not implemented yet, will be responsible for dumping unit info

