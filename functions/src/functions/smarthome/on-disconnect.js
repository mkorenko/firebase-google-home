import functions from 'firebase-functions';

export const onDisconnect = (body, headers) => {
  functions.logger.log(
      'onDisconnect: user account unlinked from Google Assistant');
  // Return empty response
  return {};
};
