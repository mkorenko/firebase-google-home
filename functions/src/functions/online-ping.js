const functions = require('firebase-functions');

const {firebaseRef} = require('../firebase-ref');
const {
  DEVICE_RESPONSE_TIMEOUT_MS,
  DEVICE_ONLINE_REFRESH_INTERVAL_MS,
} = require('../constants');

const DEVICE_ONLINE_THRESHOLD =
    DEVICE_RESPONSE_TIMEOUT_MS +
    DEVICE_ONLINE_REFRESH_INTERVAL_MS;

const onlinePing =
  functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const rootSnapshot = await firebaseRef.once('value');
    if (!rootSnapshot.hasChildren()) {
      return;
    }

    const promises = [];
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

module.exports = {onlinePing};
