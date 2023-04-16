import { applicationDefault, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth"

import * as dotenv from "dotenv"
dotenv.config()

const firebaseApp = initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    databaseURL: "https://bereal-76df3-default-rtdb.firebaseio.com/",
    
});

export function authorizeToken(token) {
    return getAuth(firebaseApp).verifyIdToken(token);
};

export function getUserByEmail(email) {
    return getAuth(firebaseApp).getUserByEmail(email);
}