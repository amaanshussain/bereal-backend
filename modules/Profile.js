import { Router } from "express";
var router = Router();

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database"

import { authorizeToken, getUserByEmail } from "./Admin.js";

import config from '../config.js'

const firebaseApp = initializeApp(config);
const database = getDatabase(firebaseApp);

export function getUser(uid) {
    return get(ref(database, 'users/' + uid));
}

router.get('/me', function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;

        getUser(uid).then((snapshot) => {
            const data = snapshot.val()
            const profile = {};
            profile.email = data.email;
            profile.name = data.name ? data.name : null;
            profile.image = data.image ? data.image : null;
            res.send(profile)
        })
    }).catch(error => {
        res.send({"error": "couldn't refresh token, please log back in"})
    });
})

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
            if (data.hasOwnProperty('name')) {
                profile.name = data.name;
            } else {
                profile.name = null;
            }
            if (data.hasOwnProperty('image')) {
                profile.image = data.image;
            } else {
                profile.image = null;
            }
            if (data.hasOwnProperty('email')) {
                profile.email = data.email;
            } else {
                profile.email = null;
            }
            res.send(profile)
        })
    }).catch(error => {
        res.send({"error": "couldn't refresh token, please log back in"})
    });
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
    }).catch(error => {
        res.send({"error": "couldn't refresh token, please log back in"})
    });
})

router.get('/bereal', function (req, res) {
    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;
        getUser(uid).then((snapshot) => {
            const data = snapshot.val();
            if (!data.hasOwnProperty("bereal")) {
                res.send({"error": "user hasn't sent bereal today."})
                return;
            }
            const bereals = data.bereal;

            const date = new Date();
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}-${mm}-${dd}`;

            for (let i = 0; i < bereals.length; i++) {
                const bereal = bereals[i];
                if (bereal.date == formattedDate) {
                    res.send({ "bereal": bereal });
                    return;
                }
            }
        })
    }).catch(error => {
        res.send({"error": "couldn't refresh token, please log back in"})
    });
})

router.post('/search', function (req, res) {
    const email = req.body.email;

    getUserByEmail(email).then((user) => {
        const uid = user.uid;
        getUser(uid).then((snapshot) => {
            const data = snapshot.val();
            const profile = {};
            profile.uid = uid;
            if (data.hasOwnProperty('name')) {
                profile.name = data.name;
            } else {
                profile.name = null;
            }
            if (data.hasOwnProperty('image')) {
                profile.image = data.image;
            } else {
                profile.image = null;
            }
            if (data.hasOwnProperty('email')) {
                profile.email = data.email;
            } else {
                profile.email = null;
            }
            res.send(profile)
        })
    }).catch((error) => {
        res.send({"error": "couldn't find user from email."})
    })

})


export default router;