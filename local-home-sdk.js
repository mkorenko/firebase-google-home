const DEVICE_HTTP_PORT = 3310;

/* utils */
const hex2a = (hex) => {
  const arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
  }
  return arr.join('');
};

/* app */
const {
  App,
  Constants,
  DataFlow,
  Execute,
  Intents,
  IntentFlow,
} = smarthome;

const localHomeSdk = new App('1.2.0');

const identifyHandler = async (request) => {
  const scanData = request.inputs[0].payload.device.udpScanData;
  if (!scanData) {
    throw new IntentFlow.HandlerError(
        request.requestId,
        'invalid_request',
        'Invalid scan data',
    );
  }

  const localDeviceId = hex2a(scanData.data);
  const response = {
      intent: Intents.IDENTIFY,
      requestId: request.requestId,
      payload: {
          device: {
              id: localDeviceId,
              verificationId: localDeviceId,
          }
      }
  };

  console.info(`identify: ${localDeviceId}`);
  return response;
};

const executeHandler = async (request) => {
  const {requestId} = request;
  const {payload: {commands}} = request.inputs[0];

  const command = request.inputs[0].payload.commands[0];
  const execution = command.execution[0];

  const response =
    new Execute.Response.Builder()
      .setRequestId(requestId);

  const promises = [];
  for (const {devices, execution} of commands) {
    for (const device of devices) {
      for (const {command, params} of execution) {
        promises.push((async () => {
          console.log("Handling EXECUTE intent for device: " + JSON.stringify(device));

          const deviceId = device.id;

          const cmd = new DataFlow.HttpRequestData();
          cmd.requestId = requestId;
          cmd.deviceId = deviceId;
          cmd.port = DEVICE_HTTP_PORT;
          cmd.data = JSON.stringify({
            'request_id': requestId,
            'command': command,
            'params': params,
          });
          cmd.path = '/cmd';
          cmd.method = Constants.HttpOperation.POST;
          cmd.dataType = 'application/json';
          cmd.isSecure = false;

          console.info(`execute: sending "${command}" to ${deviceId}`);
          console.debug(`execute: ${deviceId} "${command}" request`, requestId, params);

          try {
            const cmdResponse = await localHomeSdk.getDeviceManager().send(cmd);

            const {httpResponse} = cmdResponse;
            const cmdResult = JSON.parse(httpResponse.body);
            console.debug(`execute: ${deviceId} "${command}" response`,cmdResult);

            if (cmdResult['error_code']) {
              response.setErrorState(deviceId, cmdResult['error_code']);
              console.warn(`execute: ${deviceId} "${command}" error response: "${cmdResult['error_code']}"`);
              return;
            }

            const state = {
              ['online']: true,
              ...cmdResult,
            };
            response.setSuccessState(deviceId, state);
          } catch (err) {
            response.setErrorState(deviceId, err.errorCode || 'hardError');
            console.error('An error occurred sending the command', err);
          }
        })());
      }
    }
  }

  await Promise.all(promises);

  try {
    return response.build();
  } catch (err) {
    throw new IntentFlow.HandlerError(
        requestId,
        'invalid_request',
        err.message,
    );
  }
};

const queryHandler = async (request) => {
  const {requestId} = request;
  const {payload: {devices}} = request.inputs[0];
  const payload = {devices: {}};

  const promises = [];
  for (const device of devices) {
    promises.push((async () => {
      const deviceId = device.id;

      console.info(`query: querying ${deviceId}`);

      const cmd = new DataFlow.HttpRequestData();
      cmd.requestId = requestId;
      cmd.deviceId = deviceId;
      cmd.port = DEVICE_HTTP_PORT;
      cmd.method = Constants.HttpOperation.GET;
      cmd.path = `/query`;

      let ghState;
      try {
        const cmdResponse = await localHomeSdk.getDeviceManager().send(cmd);

        const {httpResponse} = cmdResponse;

        if (httpResponse.statusCode !== 200) {
          throw new Error(`HTTP error: ${httpResponse.statusCode}`);
        }

        ghState = JSON.parse(httpResponse.body);

        console.debug(`query: ${deviceId} response`, ghState);
        ghState['online'] = true;
      } catch (e) {
        ghState = {
          'status': 'ERROR',
          'errorCode': e.errorCode || 'hardError',
        };
        console.error('An error occurred sending the command', e);
      }

      payload.devices[deviceId] = ghState;
    })());
  }

  await Promise.all(promises);

  console.debug(
      'onQuery: response',
      {data: {requestId, payload}},
  );

  return {requestId, payload};
};

localHomeSdk
    .onIdentify(identifyHandler)
    .onExecute(executeHandler)
    .onQuery(queryHandler)
    .listen()
    .then(() => console.log('Ready'))
    .catch((e) => console.error(e));
