import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth"


const firebaseApp = initializeApp({
    credential: applicationDefault(),
    databaseURL: "https://bereal-76df3-default-rtdb.firebaseio.com/",
    
});

export function authorizeToken(token) {
    return getAuth(firebaseApp).verifyIdToken(token);
};

export function getUserByEmail(email) {
    return getAuth(firebaseApp).getUserByEmail(email);
}