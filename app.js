require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { cachedDataVersionTag } = require('v8');
const { nextTick } = require('process');

mongoose.connect(process.env.DATABASE_URI, {useUnifiedTopology: true, useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, "MongoDB connection error:"));

const loginSchema = new mongoose.Schema({
    username: String,
    password: String
});
const loginModel = mongoose.model('Login', loginSchema);

const chatSchema = new mongoose.Schema({
    username: String,
    message: String
});

const connectedUsers = {};

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('chat');
});

const server = http.listen(3000, () => {
    console.log('Listening on 3000');
});

io.on('connection', (socket) => {
    socket.on('message', (data) => {
        io.sockets.emit('message', data);

        const chatModel = mongoose.model(data.channel + 'Channel', chatSchema);
        chatModel({
            username : data.username,
            message : data.message
        }).save((err) => {
            if (err) throw err;
        });
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    socket.on('register-acc', async (data) => {
        try {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const user = data.username;

            loginModel.findOne({
                username: user
            }, (err, data) => {
                if (err)  {
                    throw err;
                }
                if (!data) {
                    loginModel({
                        username: user,
                        password: hashedPassword
                    }).save((err) => {
                        if (err) throw err;
                        socket.emit('register-acc', true);
                    });
                }
                else {
                    socket.emit('register-acc', false);
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    });

    socket.on('login-attempt', (data) => {
        const typedPass = data.password;
        try {
            loginModel.findOne({
                username: data.username
            }, async (err, data) => {
                if (err)  {
                    throw err;
                }
                if (data && await bcrypt.compare(typedPass, data.password)) {
                    // const accessToken = createToken(username);
                    socket.emit('login-attempt', true);
                }
                else {
                    socket.emit('login-attempt', false);
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    });

    socket.on('user-connected', (data) => {
        connectedUsers[socket.id] = data;
        io.sockets.emit('user-connected', getUsers());

        getChannelHist('output').then(hist => {
            socket.emit('load-messages', { channel: 'output', messages : hist });
        });
        getChannelHist('output2').then(hist => {
            socket.emit('load-messages', { channel: 'output2', messages : hist });
        });
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        socket.broadcast.emit('user-disconnected', getUsers());
    });
});

function getUsers() {
    const values = Object.keys(connectedUsers).map((key) => {
        return connectedUsers[key];
    });
    return values;
}

async function getChannelHist(channel) {
    const chatModel = mongoose.model(channel + 'Channel', chatSchema);
    let hist;
    await chatModel.find({}, {
        "_id": 0,
        "__v": 0
    }, (err, data) => {
        if (err)  {
            throw err;
        }
        hist = data;
    });
    return hist;
}

// function createToken(username) {
//     const user = { name: username };

//     return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
// }

// function authenticateToken(req, res, next) {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (token === null) return res.sendStatus(401);

//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//         if (err) return res.sendStatus(403);
//         req.user = user;
//         next();
//     })
     
// }