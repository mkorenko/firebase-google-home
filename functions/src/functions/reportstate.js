const functions = require('firebase-functions');

const {firebaseRef} = require('../firebase-ref');
const {homegraph} = require('../homegraph');

const onDeviceGhStateChanged = async (deviceId, snapshotVal) => {
  functions.logger.info(
      `${deviceId}: gh_state changed`,
      {snapshotVal},
  );

  let ghState = {...snapshotVal};
  delete ghState['gh_notifications'];

  const isOnline = ghState['online'] !== false;
  if (isOnline) {
    ghState['online'] = true;
  } else {
    ghState = {
      'online': false,
    };
  }

  const id = new Date().getTime().toString();

  const requestBody = {
    requestId: `req_${id}`,
    agentUserId: '123',
    payload: {
      devices: {
        states: {
          [deviceId]: ghState,
        },
      },
    },
  };

  const ghNotifications = snapshotVal['gh_notifications'];
  if (ghNotifications) {
    requestBody.eventId = `evt_${id}`;
    requestBody.payload.devices.notifications = {
      [deviceId]: ghNotifications,
    };
  }

  functions.logger.debug(
      'homegraph: request',
      {data: {requestBody}},
  );

  const res = await homegraph.devices.reportStateAndNotification({
    requestBody,
  });

  functions.logger.debug(
      'homegraph: response',
      {data: {status: res.status, data: res.data}},
  );
};

const reportstate =
  functions.database.ref('{deviceId}/state/gh_state')
      .onWrite(async (change, context) => {
        const {deviceId} = context.params;

        const snapshot =
          await firebaseRef.child(`${deviceId}/state/gh_state`).once('value');

        await onDeviceGhStateChanged(deviceId, snapshot.val());
      });

module.exports = {reportstate};
