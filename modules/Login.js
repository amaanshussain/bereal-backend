import { Router } from "express";
var router = Router();

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database"

import config from '../config.js'

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
                res.send({ "code": 200, "message": "User signed in.", "token": token })
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



export default router;