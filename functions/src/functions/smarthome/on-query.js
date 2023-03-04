const functions = require('firebase-functions');

const {firebaseRef} = require('../../firebase-ref');

const onQuery = async (body) => {
  const {requestId} = body;
  const {payload: {devices}} = body.inputs[0];

  const promises = [];
  const payload = {devices: {}};
  for (const device of devices) {
    promises.push((async () => {
      const deviceId = device.id;

      const snapshot =
        await firebaseRef.child(`${deviceId}/state/gh_state`).once('value');

      let ghState = {...snapshot.val()};

      ghState['status'] = 'SUCCESS';

      const isOnline = ghState['online'] !== false;
      if (isOnline) {
        ghState['online'] = true;
      } else {
        ghState = {
          'online': false,
          'status': 'OFFLINE',
          'errorCode': 'deviceOffline',
        };
      }

      payload.devices[deviceId] = ghState;
    })());
  }

  await Promise.all(promises);

  functions.logger.debug(
      'onQuery: response',
      {data: {requestId, payload}},
  );

  return {requestId, payload};
};

module.exports = {onQuery};
