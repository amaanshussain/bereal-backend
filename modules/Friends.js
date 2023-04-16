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

function getLatestBereal(uid) {

    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    return get(ref(database, 'users/' + uid)).then((snapshot) => {
        const user = snapshot.val();
        const bereals = user['bereal']
        if (!bereals) {
            return;
        }

        const bereal = bereals[bereals.length - 1];

        if (bereal.date == formattedDate) {
            // profile, displayname, pic1url, pic2url
            return {
                profile: user.image,
                displayname: user.name,
                pic1url: bereal.pics[0],
                pic2url: bereal.pics[1]
            }
        }

    })
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
        res.send({ "error": "couldn't authorize token, please log back in" })
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
                    if (data.includes(friendId)) {
                        return;
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
                    if (data.includes(userId)) {
                        return;
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

router.post('/deleterequest', function (req, res) {
    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    var fid = req.body.fid;

    authorizeToken(token).then(async (decodedToken) => {
        const userID = decodedToken.uid;

        const promises = []

        // update receiver of request
        promises.push(
            getFriendsLists(userID, 'outgoing').then((snapshot) => {
                var data = snapshot.val();
                if (!data) {
                    return;
                }
                const index = data.indexOf(fid);
                if (index > -1) {
                    data.splice(index, 1);
                }
                setFriendsLists(userID, 'outgoing', data).then(() => {

                })
            }))

        // update sender of request
        promises.push(
            getFriendsLists(fid, 'incoming').then((snapshot) => {
                var data = snapshot.val();
                if (!data) {
                    return
                }
                const index = data.indexOf(userID);
                if (index > -1) {
                    data.splice(index, 1);
                }
                setFriendsLists(fid, 'incoming', data).then(() => {

                })
            }))

        Promise.all(promises).then((value) => {
            res.send({ "success": "deleted friend request." })
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

router.post('/reject', function (req, res) {
    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    var fid = req.body.fid;

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
                const index = data.indexOf(fid);
                if (index > -1) {
                    data.splice(index, 1);
                }
                setFriendsLists(userID, 'incoming', data).then(() => {

                })
            }))

        // update sender of request
        promises.push(
            getFriendsLists(fid, 'outgoing').then((snapshot) => {
                var data = snapshot.val();
                if (!data) {
                    return
                }
                const index = data.indexOf(userID);
                if (index > -1) {
                    data.splice(index, 1);
                }
                setFriendsLists(fid, 'outgoing', data).then(() => {

                })
            }))

        Promise.all(promises).then((value) => {
            res.send({ "success": "rejected friend request." })
        })
    })

})


router.post('/delete', function (req, res) {
    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    const fid = req.body.fid;

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;
        const promises = [];

        promises.push(
            getFriendsLists(uid, "friends").then((snapshot) => {
                var data = snapshot.val();
                console.log(data)

                const index = data.indexOf(fid);
                if (index > -1) {
                    data.splice(index, 1);
                }
                setFriendsLists(uid, "friends", data).then(() => {
                    try {
                        res.send({ "success": "removed friend" })
                    } catch (error) {

                    }
                })
            }))

        promises.push(
            getFriendsLists(fid, "friends").then((snapshot) => {
                var data = snapshot.val();
                console.log(data)

                const index = data.indexOf(uid);
                if (index > -1) {
                    data.splice(index, 1);
                }
                setFriendsLists(fid, "friends", data).then(() => {
                    try {
                        res.send({ "success": "removed friend" })
                    } catch (error) {

                    }
                })
            }))

        Promise.all(promises).then((value) => {
            res.send({ "success": "deleted friend." })
        })
    })
})

router.get('/timeline', function (req, res) {
    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;

        getFriendsLists(uid, "friends").then((result) => {
            var friends = result.val();
            if (!friends) {
                friends = [];
            }

            Promise.all(friends.map((fid) => getLatestBereal(fid))).then((result) => {

                console.log(result)
                const bereals = [];

                for (let i = 0; i < result.length; i++) {
                    const bereal = result[i];
                    if (bereal != null) {
                        bereals.push(bereal);
                    }
                }


                console.log(bereals)

                res.send({ "bereals": bereals })
            }).catch((error) => console.log(error))

        })
    })
})

export default router;