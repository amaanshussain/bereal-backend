import express from 'express';

import Login from './modules/Login.js'
import Friends from './modules/Friends.js'
import Profile from './modules/Profile.js'
import BeReal from './modules/BeReal.js'
var app = express();
app.use(express.json()); // read json from request bodys

app.get('/', function (req, res) {
    res.send({"status": "success"})
});

app.use('/api/login', Login)
app.use('/api/friends', Friends)
app.use('/api/profile', Profile)
app.use('/api/bereal', BeReal)

var server = app.listen(6969, function () {
    console.log('Server is live...');
});
