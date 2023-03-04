const functions = require('firebase-functions');

const onDisconnect = (body, headers) => {
  functions.logger.log(
      'onDisconnect: user account unlinked from Google Assistant');
  // Return empty response
  return {};
};

module.exports = {onDisconnect};
