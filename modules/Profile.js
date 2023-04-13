import { Router } from "express";
var router = Router();

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database"

import { authorizeToken, getUserByEmail } from "./Admin.js";

import config from '../config.js'

const firebaseApp = initializeApp(config);
const database = getDatabase(firebaseApp);

function getUser(uid) {
    return get(ref(database, 'users/' + uid));
}

router.get('/:uid/info', function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = req.params.uid;

        getUser(uid).then((snapshot) => {
            const data = snapshot.val()
            const profile = {};
            profile.email = data.email;
            profile.name = data.name ? data.name : null;
            profile.image = data.image ? data.image : null;
            res.send(profile)
        })
    })
})

router.post('/setinfo', function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    const name = req.body.name;
    const image = req.body.image;

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;

        getUser(uid).then((snapshot) => {
            const data = snapshot.val();

            if (name) {
                data.name = name;
            }
            if (image) {
                data.image = image;
            }

            set(ref(database, 'users/' + uid), data).then((response) => {
                res.send({"success": "profile updated."})
            })

        })

    })
})



export default router;