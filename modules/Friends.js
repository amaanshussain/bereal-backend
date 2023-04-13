import { Router } from "express";
var router = Router();

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get } from "firebase/database"

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

function sendFriendRequest(sourceID, destID, callback) {

    // set references to database location
    const sourceOutgoing = ref(database, 'users/' + sourceID + '/friends/outgoing')
    const destIncoming = ref(database, 'users/' + destID + '/friends/incoming')

    // get value then set to reference
    get(sourceOutgoing).then((snapshot) => {
        var data = snapshot.val();
        if (!data) {
            data = [destID]
        } else {
            if (!data.includes(destID)) {
                data.push(destID)
            } else {
                callback({ "success": "Sent friend request." })
            }
        }
        set(sourceOutgoing, data)
    })
    onValue(destIncoming, (snapshot) => {
        var data = snapshot.val();
        if (!data) {
            data = [sourceID]
        } else {
            if (!data.includes(sourceID)) {
                data.push(sourceID)
            } else {
                callback({ "success": "Sent friend request." })
            }
        }
        set(destIncoming, data)
    });
}


router.get('/friends', function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;

        const friendsSnapshot = ref(database, 'users/' + uid + '/friends/friends');
        onValue(friendsSnapshot, (snapshot) => {
            const data = snapshot.val();
            res.send({ "friends": data });
        });
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

        const friendsSnapshot = ref(database, 'users/' + uid + '/friends/outRequest');
        onValue(friendsSnapshot, (snapshot) => {
            const data = snapshot.val();
            res.send({ "requests": data });
        });
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

        const friendsSnapshot = ref(database, 'users/' + uid + '/friends/inRequest');
        onValue(friendsSnapshot, (snapshot) => {
            const data = snapshot.val();
            res.send({ "requests": data });
        });
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

    var email = req.body.email;

    authorizeToken(token).then((decodedToken) => {
        const userId = decodedToken.uid;
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