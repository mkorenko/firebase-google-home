const {google} = require('googleapis');

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/homegraph'],
});

const homegraph = google.homegraph({
  version: 'v1',
  auth: auth,
});

module.exports = {homegraph};
