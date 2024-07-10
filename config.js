// import { initializeApp } from "firebase/app";
// import { getFirestore, collection } from "firebase/firestore";
// import { config } from "dotenv";

// config({ path: './.env.keys'})
// const firebaseConfig = {
//     apiKey: process.env.APIKEY,
//     authDomain: process.env.AUTHDOMAIN,
//     projectId: process.env.PROJECTID,
//     storageBucket: process.env.STORAGEBUCKET,
//     messagingSenderId: process.env.MESSAGINGSENDERID,
//     appId: process.env.APPID,
//     measurementId: process.env.MEASUREMENTSID
// };
// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// // Get a reference to the 'envs' collection
// const envs = collection(db, 'envs');

// export default envs;

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: './.env.keys' });

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.PROJECTID
});

const db = getFirestore();
const envs = db.collection('envs');

export default envs;
