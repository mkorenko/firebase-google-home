const functions = require('firebase-functions');
const {smarthome: smarthomeApp} = require('actions-on-google');

const {onSync} = require('./on-sync');
const {onQuery} = require('./on-query');
const {onExecute} = require('./on-execute');
const {onDisconnect} = require('./on-disconnect');

const app = smarthomeApp();

app.onSync(onSync);
app.onQuery(onQuery);
app.onExecute(onExecute);
app.onDisconnect(onDisconnect);

// overwrite app handler to add dummy /ping endpoint
// for keeping the function warm
const origAppHandler = app.handler;
app.handler = async function(body, headers, metadata) {
  if (metadata.express.request.path === '/ping') {
    return {
      status: 200,
      headers: {},
      body: `ok`,
    };
  }

  return await origAppHandler.call(this, body, headers, metadata);
};

const smarthome = functions.https.onRequest(app);

module.exports = {smarthome};
