const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { cachedDataVersionTag } = require('v8');
const { config } = require('./config.js');

mongoose.connect(config.DATABASE_URI, {useUnifiedTopology: true, useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, "MongoDB connection error:"));
var loginSchema = new mongoose.Schema({
    username: String,
    password: String
});

var loginModel = mongoose.model('LoginModel', loginSchema);

var connectedUsers = {};

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
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        socket.broadcast.emit('user-disconnected', getUsers());
    });
});

function getUsers() {
    var values = Object.keys(connectedUsers).map((key) => {
        return connectedUsers[key];
    });
    return values;
}