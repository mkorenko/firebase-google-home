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

const smarthome = functions.https.onRequest(app);

module.exports = {smarthome};
