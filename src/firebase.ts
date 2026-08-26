// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbQUpzlVDZoh-D_qfrmOOjPoIzqS0qK8c",
  authDomain: "masif-abc10.firebaseapp.com",
  projectId: "masif-abc10",
  storageBucket: "masif-abc10.firebasestorage.app",
  messagingSenderId: "88524116215",
  appId: "1:88524116215:web:96d7dba39b41669fd483f2",
  measurementId: "G-JEPR7TYYMH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);