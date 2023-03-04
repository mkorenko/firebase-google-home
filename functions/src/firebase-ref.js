const admin = require('firebase-admin');

admin.initializeApp();
const firebaseRef = admin.database().ref('/');

module.exports = {firebaseRef};
