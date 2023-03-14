import functions from 'firebase-functions';
import {smarthome as smarthomeApp} from 'actions-on-google';

import {onSync} from './on-sync.js';
import {onQuery} from './on-query.js';
import {onExecute} from './on-execute.js';
import {onDisconnect} from './on-disconnect.js';

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

export const smarthome = functions.https.onRequest(app);
