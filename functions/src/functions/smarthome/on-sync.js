const functions = require('firebase-functions');

const {firebaseRef} = require('../../firebase-ref');

const onSync = async (body) => {
  const snapshot = await firebaseRef.once('value');
  const root = snapshot.val();

  const ghDevicesConfig = [];
  for (const [deviceId, deviceData] of Object.entries(root)) {
    const ghConfig = deviceData['gh_config'];

    const ghDeviceConfig = {
      id: deviceId,
      type: `action.devices.types.${ghConfig.type}`,
      name: ghConfig.name,
      deviceInfo: ghConfig.deviceInfo,
      willReportState: ghConfig.willReportState,
      notificationSupportedByAgent: ghConfig.notificationSupportedByAgent,
      traits: [],
      attributes: {},
    };

    for (const [
      traitShortName,
      traitAttributes,
    ] of Object.entries(ghConfig.traits)) {
      ghDeviceConfig.traits.push(`action.devices.traits.${traitShortName}`);

      if (traitAttributes === true) {
        continue;
      }

      for (const [
        attributeName,
        attributeConfig,
      ] of Object.entries(traitAttributes)) {
        ghDeviceConfig.attributes[attributeName] = attributeConfig;
      }
    }

    ghDevicesConfig.push(ghDeviceConfig);
  }

  const result = {
    requestId: body.requestId,
    payload: {
      agentUserId: '123',
      devices: ghDevicesConfig,
    },
  };

  functions.logger.debug(
      'onSync',
      {data: result},
  );

  return result;
};

module.exports = {onSync};
