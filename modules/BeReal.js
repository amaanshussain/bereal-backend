import { Router } from "express";
var router = Router();

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database"

import { authorizeToken } from "./Admin.js";

import config from '../config.js'

const firebaseApp = initializeApp(config);
const database = getDatabase(firebaseApp);

function getBeReals(uid) {
    return get(ref(database, 'users/' + uid + '/bereal'));
}

function setBeReals(uid, value) {
    return set(ref(database, 'users/' + uid + '/bereal'), value)
}

router.post('/new', function (req, res) {
    const pic1 = req.body.pic1;
    const pic2 = req.body.pic2;

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {
        const uid = decodedToken.uid;

        getBeReals(uid).then((snapshot) => {
            var data = snapshot.val();
            if (!data) {
                data = [];
            }

            const date = new Date();
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}-${mm}-${dd}`;

            for (let i = 0; i < data.length; i++) {
                const bereal = data[i];
                if (bereal.date == formattedDate) {
                    res.send({"error": "bereal already sent today"});
                    return;
                }
            }

            const todaysBereal = {
                date: formattedDate,
                pics: [pic1, pic2]
            }

            data.push(todaysBereal)

            console.log(data)

            setBeReals(uid, data).then(() => {
                res.send({"success": "uploaded bereal"})
            })
        })
    })
})

router.post('/delete', function (req, res) {
    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then((decodedToken) => {

        const uid = decodedToken.uid;
        getBeReals(uid).then((snapshot) => {
            const data = snapshot.val();

            const date = new Date();
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}-${mm}-${dd}`;
    
            for (let i = 0; i < data.length; i++) {
                const bereal = data[i];
                if (bereal.date == formattedDate) {
                    data.splice(i, 1);
                    setBeReals(uid, data).then(() => {
                        res.send({"success": "deleted bereal"})
                        return;
                    })
                }
            }
        })
    })
})




export default router