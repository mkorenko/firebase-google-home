const functions = require('firebase-functions');

const {firebaseRef} = require('../../firebase-ref');
const {
  DEVICE_RESPONSE_TIMEOUT_MS,
} = require('../../constants');

const onExecute = async (body) => {
  let loggerMethod = 'debug';

  const {requestId} = body;
  const {payload: {commands}} = body.inputs[0];

  const promises = [];
  const deviceCmdResults = [];
  for (const {devices, execution} of commands) {
    for (const device of devices) {
      for (const {command, params} of execution) {
        promises.push((async () => {
          const deviceId = device.id;
          const result = {
            'device_id': deviceId,
            'command': command,
            'params': params,
          };
          deviceCmdResults.push(result);

          // get current ghState
          const ghStateSnapshot =
            await firebaseRef.child(`${deviceId}/state/gh_state`)
                .once('value');
          const ghState = ghStateSnapshot.val();
          result['gh_state'] = ghState;

          // device online check
          const isOnline = ghState['online'] !== false;
          if (!isOnline) {
            result['error_code'] = 'deviceOffline';
            loggerMethod = 'error';
            return;
          }

          // device is online - submitting cmd
          await firebaseRef.child(`${deviceId}/cmd`).update({
            command,
            params,
          });

          const cmdStarted = new Date();

          let unsubscribe;
          let timeoutHandle;
          try {
            await new Promise((resolve, reject) => {
              unsubscribe = firebaseRef.child(`${deviceId}/cmd/result`)
                  .on('value', (snapshot) => {
                    if (!snapshot || !snapshot.exists()) {
                      return;
                    }

                    unsubscribe();
                    clearTimeout(timeoutHandle);

                    const snapshotVal = snapshot.val();
                    if (snapshotVal['error_code']) {
                      result['error_code'] = snapshotVal['error_code'];
                      if (loggerMethod !== 'error') {
                        loggerMethod = 'warn';
                      }
                    } else {
                      result['partial_gh_state'] = snapshotVal;
                    }

                    resolve();
                  });

              timeoutHandle =
                setTimeout(reject, DEVICE_RESPONSE_TIMEOUT_MS);
            });
          } catch (err) {
            unsubscribe();
            result['error_code'] = 'hardError';
            loggerMethod = 'error';
          }

          result['cmd_response_time'] = new Date() - cmdStarted;

          await firebaseRef.child(deviceId).child('cmd').remove();
        })());
      }
    }
  }

  await Promise.all(promises);

  const commandsResult = [];
  for (const cmdResult of deviceCmdResults) {
    const deviceResult = {
      ids: [cmdResult['device_id']],
    };
    commandsResult.push(deviceResult);

    const isOnline = cmdResult['error_code'] !== 'deviceOffline';
    if (isOnline) {
      deviceResult['status'] = cmdResult['error_code'] ? 'ERROR' : 'SUCCESS';
    } else {
      deviceResult['status'] = 'OFFLINE';
    }

    if (isOnline) {
      // device is online
      deviceResult['states'] = {
        ['online']: true,
        ...cmdResult['gh_state'],
        ...cmdResult['partial_gh_state'],
      };
      if (cmdResult['error_code']) {
        deviceResult['errorCode'] = cmdResult['error_code'];
      }
    } else {
      // device is offline
      deviceResult['states'] = {
        ['online']: false,
      };
      deviceResult['errorCode'] = 'deviceOffline';
    }
  }

  const result = {
    requestId: requestId,
    payload: {
      commands: commandsResult,
    },
  };

  functions.logger[loggerMethod](
      'onExecute: response',
      {data: {result, deviceCmdResults}},
  );

  return result;
};

module.exports = {onExecute};
