import {google} from 'googleapis';

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/homegraph'],
});

export const homegraph = google.homegraph({
  version: 'v1',
  auth,
});
