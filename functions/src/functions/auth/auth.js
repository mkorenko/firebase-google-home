import functions from 'firebase-functions';

export const auth = functions.https.onRequest((request, response) => {
  if (request.method !== 'GET') {
    response.send(405, 'Method Not Allowed');
    return;
  }

  const base = decodeURIComponent(request.query.redirect_uri);

  return response.redirect(`${base}?code=xxxxxx&state=${request.query.state}`);
});
