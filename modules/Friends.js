import { Router } from "express";
var router = Router();

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database"

import { authorizeToken, getUserByEmail } from "./Admin.js";

import config from '../config.js'

const firebaseApp = initializeApp(config);
const database = getDatabase(firebaseApp);

function getFriendsLists(uid, type) {
    return get(ref(database, 'users/' + uid + '/friends/' + type));
}

function setFriendsLists(uid, type, value) {
    return set(ref(database, 'users/' + uid + '/friends/' + type), value)
}

router.get('/friends', function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;

        getFriendsLists(uid, 'friends').then((snapshot) => {
            var data = snapshot.val();
            if (!data) {
                data = []
            }
            res.send({ "friends": data });
        })
    }).catch((error) => {
        res.send(error)
    });
});

router.get('/outgoing', function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;

        getFriendsLists(uid, 'outgoing').then((snapshot) => {
            var data = snapshot.val();
            if (!data) {
                data = []
            }
            res.send({ "outgoing": data });
        })
    }).catch((error) => {
        res.send(error)
    });
});

router.get('/incoming', function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;

        getFriendsLists(uid, 'incoming').then((snapshot) => {
            var data = snapshot.val();
            if (!data) {
                data = []
            }
            res.send({ "incoming": data });
        })
    }).catch((error) => {
        res.send(error)
    });
});

router.post('/request', function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const userId = decodedToken.uid;

        var email = req.body.email;
        getUserByEmail(email).then((user) => {
            const friendId = user.uid;
            const promises = [];

            promises.push(
                getFriendsLists(userId, 'outgoing').then((snapshot) => {
                    var data = snapshot.val()
                    if (!data) {
                        data = []
                    }
                    data.push(friendId)
                    setFriendsLists(userId, 'outgoing', data)
                }))
            promises.push(
                getFriendsLists(friendId, 'incoming').then((snapshot) => {
                    var data = snapshot.val()
                    if (!data) {
                        data = []
                    }
                    data.push(userId)
                    setFriendsLists(friendId, 'incoming', data)
                }))

            Promise.all(promises).then((value) => {
                res.send({ "success": "sent friend request." })
            })
        })
    })
})

router.post('/accept', async function (req, res) {
    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    var uid = req.body.uid;

    authorizeToken(token).then(async (decodedToken) => {
        const userID = decodedToken.uid;

        const promises = []

        // update receiver of request
        promises.push(
            getFriendsLists(userID, 'incoming').then((snapshot) => {
                var data = snapshot.val();
                if (!data) {
                    return;
                }
                const index = data.indexOf(uid);
                if (index > -1) {
                    data.splice(index, 1);
                }
                setFriendsLists(userID, 'incoming', data).then(() => {
                    // add friend to receiver
                    getFriendsLists(userID, 'friends').then((snapshot) => {
                        var data = snapshot.val();
                        if (!data) {
                            data = []
                        }
                        data.push(uid)
                        setFriendsLists(userID, 'friends', data)
                    })
                })
            }))

        // update sender of request
        promises.push(
            getFriendsLists(uid, 'outgoing').then((snapshot) => {
                var data = snapshot.val();
                if (!data) {
                    return
                }
                const index = data.indexOf(userID);
                if (index > -1) {
                    data.splice(index, 1);
                }
                setFriendsLists(uid, 'outgoing', data).then(() => {
                    // add friend to sender
                    getFriendsLists(uid, 'friends').then((snapshot) => {
                        var data = snapshot.val();
                        if (!data) {
                            data = []
                        }
                        data.push(userID)
                        setFriendsLists(uid, 'friends', data)
                    })
                })
            }))

        Promise.all(promises).then((value) => {
            res.send({ "success": "accepted friend request." })
        })
    })

})
export default router;