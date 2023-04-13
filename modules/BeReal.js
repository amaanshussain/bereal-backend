import { Router } from "express";
var router = Router();

import * as dotenv from 'dotenv'
dotenv.config();

import multer from 'multer'
const upload = multer({ dest: 'uploads/' });
import fs from 'fs'

import Cosmic from 'cosmicjs'
const bucket = Cosmic().bucket({
    slug: process.env.COSMICBUCKETSLUG,
    read_key: process.env.COSMICREADKEY,
    write_key: process.env.COSMICWRITEKEY
})


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

async function uploadToCosmic(files) {
    var urls = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await bucket.media.insertOne({
            media: {
                originalname: file.originalname,
                buffer: fs.createReadStream(file.path)
            },
            folder: 'berealimages'
        });
        const url = data.media.url;
        urls.push(url)
        fs.unlinkSync(file.path)
    }
    return urls;
}

router.post('/new', upload.array('file', 2), async function (req, res) {

    var token = req.headers.authorization;
    if (!token) {
        res.send({ "error": "Please enter a Bearer Token" })
    }
    token = token.replace("Bearer ", "");

    authorizeToken(token).then(async (decodedToken) => {
        const uid = decodedToken.uid;

        getBeReals(uid).then(async (snapshot) => {
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
                    res.send({ "error": "bereal already sent today" });
                    return;
                }
            }

            const files = req.files;
            if (!files) {
                res.send({ "error": "please submit with images" });
                return;
            }
            const urls = await uploadToCosmic(files);

            const todaysBereal = {
                date: formattedDate,
                pics: urls
            }
            data.push(todaysBereal)
            setBeReals(uid, data).then(() => {
                res.send({ "success": "uploaded bereal" })
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

            var count = 0;
            for (let i = 0; i < data.length; i++) {
                const bereal = data[i];
                if (bereal.date == formattedDate) {
                    data.splice(i, 1);
                    setBeReals(uid, data).then(() => {
                        res.send({ "success": "deleted bereal" })
                        return;
                    })
                } else { count += 1 }
            }
            if (count == data.length) {
                res.send({ "error": "couldnt delete todays bereal" })
                return;
            }
        })
    })
})




export default router