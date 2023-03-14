import functions from 'firebase-functions';

import {firebaseRef} from '../firebase-ref.js';
import {homegraph} from '../homegraph.js';

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

export const reportstate =
  functions.database.ref('{deviceId}/state/gh_state')
      .onWrite(async (change, context) => {
        const {deviceId} = context.params;

        const snapshot =
          await firebaseRef.child(`${deviceId}/state/gh_state`).once('value');

        await onDeviceGhStateChanged(deviceId, snapshot.val());
      });
