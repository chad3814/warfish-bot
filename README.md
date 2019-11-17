Warfish Bot
===========

This is a webserver that handles commands from Slack about warfish.net games.

You'll need to export a SESSID cookie as an environment variable. The code will use this cookie to access everything, so if the cookie is from a participant, it will get more than just anonymous data. The good news is you can create a dummy account and use the cookie for that. My attempt is not to have code that depends on a cookie from a participant, so it *should* not be a big deal, but..

Code
----

* `index.js` - handles the web and graphql serving
* `lib/graphql.js` - setups the graphql schema and root
* `lib/jar.js` - handles setting up the cookie jar
* `lib/store.js` - a generic server-local TTL cache
* `lib/map.js` - fetches a `.png` of the board for a game
* `lib/data.js` - fetches all the JSON data available from warfish.net for a game, and converts integers into actual integers, organizes and cross references everything. 
