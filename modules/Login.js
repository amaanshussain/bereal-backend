import { Router } from "express";
var router = Router();

import * as dotenv from 'dotenv'
dotenv.config()

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database"

import config from '../config.js'
import fetch, { Headers } from "node-fetch";

import { authorizeToken } from "./Admin.js";

const firebaseApp = initializeApp(config);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);

function createUser(userId, email) {
    return set(ref(database, 'users/' + userId), {
        email: email
    })
};

router.post('/', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            user.getIdToken().then((token) => {
                res.send({ "code": 200, "message": "User signed in.", "token": token, "refresh_token": user.refreshToken })
            })
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            res.send({ "code": errorCode, "message": errorMessage })
        });

});


router.post('/create', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            createUser(user.uid, user.email).then(() => {
                res.send({ "code": 200, "message": "User created." })
            })
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            res.send({ "code": errorCode, "message": errorMessage })
        });

});

router.post('/token', function (req, res) {
    const token = req.body.token;

    console.log(token)

    authorizeToken(token).then((decodedToken) => {
        console.log(decodedToken)
        if (decodedToken.hasOwnProperty('uid')) {
            res.send({
                "token": token,
                "refresh_token": decodedToken
            })
        } else {
            res.send({"error": "couldn't authorize user, please log back in"})
        }
    }).catch((err) => {
        res.send({"error": "couldn't authorize user, please log back in"})
    })
})

router.post('/refresh', function (req, res) {
    const refresh_token = req.body.refreshtoken;
    const endpoint = `https://securetoken.googleapis.com/v1/token?key=${process.env.WEBAPIKEY}`

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    fetch(endpoint, requestOptions)
        .then(response => response.json())
        .then(result => {
            var myresponse = {}
            myresponse['token'] = result.id_token;
            myresponse['refresh_token'] = result.refresh_token;
            res.send(myresponse);
        })
        .catch(error => {
            res.send({"error": "couldn't refresh token, please log back in"})
        });


})


export default router;