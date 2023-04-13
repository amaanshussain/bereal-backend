import express from 'express';
import { initializeApp } from "firebase/app";
import config from './config.js'

import Login from './modules/Login.js'
import Friends from './modules/Friends.js'

const firebaseApp = initializeApp(config);

var app = express();
app.use(express.json()); // read json from request bodys

app.get('/', function (req, res) {
    res.send({"status": "success"})
});

app.use('/api/login', Login)
app.use('/api/friends', Friends)

var server = app.listen(6969, function () {
    console.log('Server is live...');
});
