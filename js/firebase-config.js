const firebaseConfig = {
    apiKey: "AIzaSyDnLZNyZHoGQvrO_GF1WBMEVdm8pSj_hNk",
    authDomain: "alemedu-ce24a.firebaseapp.com",
    projectId: "alemedu-ce24a",
    storageBucket: "alemedu-ce24a.firebasestorage.app",
    messagingSenderId: "214170665943",
    appId: "1:214170665943:web:905a2b4dbd996581340192",
    measurementId: "G-Y9J7ZR91Z8"
};

// Initialize Firebase (Compat mode for plain HTML)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Auth & Firestore and bind to window so app.js can use them
window.fireAuth = firebase.auth();
window.fireDB = firebase.firestore();