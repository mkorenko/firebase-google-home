import functions from 'firebase-functions';

export const token = functions.https.onRequest((request, response) => {
  const grantType = request.query.grant_type || request.body.grant_type;

  const result = {
    'token_type': 'bearer',
    'access_token': 'access_token',
    'expires_in': 60 * 60 * 24,
  };

  if (grantType === 'authorization_code') {
    result['refresh_token'] = 'refresh_token';
  }

  response.status(200).json(result);
});
