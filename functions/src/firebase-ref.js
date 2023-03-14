import admin from 'firebase-admin';

admin.initializeApp();

export const firebaseRef = admin.database().ref('/');
