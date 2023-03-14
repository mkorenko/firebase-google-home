import functions from 'firebase-functions';

import {firebaseRef} from '../firebase-ref.js';
import {
  DEVICE_RESPONSE_TIMEOUT_MS,
  DEVICE_ONLINE_REFRESH_INTERVAL_MS,
} from '../constants.js';

const DEVICE_ONLINE_THRESHOLD =
    DEVICE_RESPONSE_TIMEOUT_MS +
    DEVICE_ONLINE_REFRESH_INTERVAL_MS;

export const onlinePing =
  functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const rootSnapshot = await firebaseRef.once('value');
    if (!rootSnapshot.hasChildren()) {
      return;
    }

    const promises = [];

    // keep smarthome cloud function warm
    const [, GCP_PROJECT, , FUNCTION_REGION] =
      process.env['EVENTARC_CLOUD_EVENT_SOURCE'].split('/');
    const smarthomePingUrl =
      `https://${FUNCTION_REGION}-${GCP_PROJECT}.cloudfunctions.net/smarthome/ping`;
    promises.push(fetch(smarthomePingUrl));

    // check device online timestamps
    rootSnapshot.forEach((deviceSnapshot) => {
      const deviceId = deviceSnapshot.key;

      promises.push((async () => {
        const onlineAt = deviceSnapshot.child(`online_at`).val();

        if (!onlineAt) {
          // device is not configured or
          // did not report online status yet
          return;
        }

        const now = new Date();
        if (now - onlineAt < DEVICE_ONLINE_THRESHOLD) {
          return;
        }

        await firebaseRef.child(
            `${deviceId}/state/gh_state/online`).set(false);
      })());
    });

    await Promise.all(promises);
  });
