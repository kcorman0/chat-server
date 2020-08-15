// Init
const socket = io.connect('http://localhost:3000');

var username = "";
var curChat = 'output';
var message = document.getElementById('message'),
    sendBtn = document.getElementById('send'),
    feedback = document.getElementById('feedback');
    userList = document.getElementById('user-list');
    modal = document.getElementById('myModal');
    span = document.getElementsByClassName('close')[0];
    loginBtn = document.getElementById('log-btn');
    logUserLabel = document.getElementById('log-user-label');
    logUser = document.getElementById('log-user');
    logPassLabel = document.getElementById('log-pass-label');
    logPass = document.getElementById('log-pass');
    registerBtn = document.getElementById('reg-btn');
    regUserLabel = document.getElementById('reg-user-label');
    regUser = document.getElementById('reg-user');
    regPassLabel = document.getElementById('reg-pass-label');
    regPass = document.getElementById('reg-pass');
    chatWindow = document.getElementById('chat-window');

// Events

// Send message
message.addEventListener('keydown', ({key}) => {
    if (key === "Enter") {
        if (username === "") {
            modal.style.display = 'block';
        }
        else {
            sendMessage();
        }
    }
    else if (username !== "") {
        socket.emit('typing', username);
    }
});

sendBtn.addEventListener('click', () => {
    if (username === "") {
        modal.style.display = 'block';
    }
    else {
        sendMessage();
    }
});

// Login
registerBtn.addEventListener('click', () => {
    if (regPass.value.length < 8) {
        regUserLabel.style.color = "#575ed8";
        regPassLabel.style.color = "red";
        regUserLabel.innerHTML = "Username";
        regPassLabel.innerHTML = "Password - must be 8 characters";
    }
    else {
        socket.emit('register-acc', {
            username: regUser.value,
            password: regPass.value
        });
    }
});

regPass.addEventListener('keydown', ({key}) => {
    if (key === "Enter") {
        if (regPass.value.length < 8) {
            regPassLabel.style.color = "red";
            regPassLabel.innerHTML = "Password - must be 8 characters";
        }
        else {
            socket.emit('register-acc', {
                username: regUser.value,
                password: regPass.value
            });
        }
    }
});

loginBtn.addEventListener('click', () => {
    socket.emit('login-attempt', {
        username: logUser.value, 
        password: logPass.value
    });
});

logPass.addEventListener('keydown', ({key}) => {
    if (key === "Enter") {
        socket.emit('login-attempt', {
            username: logUser.value, 
            password: logPass.value
        });
    }
});

// Close window
span.addEventListener('click', () => {
    modal.style.display = "none";
});


// Socket.io responses
socket.on('message', (data) => {
    if (data.username === username) {
        document.getElementById(data.channel).innerHTML += '<b><p><strong>' +data.username+ ': </strong>' +data.message+ '</p></b>';
    }
    else {
        document.getElementById(data.channel).innerHTML += '<p><strong>' +data.username+ ': </strong>' +data.message+ '</p>';
    }
    feedback.innerHTML = '';
});

socket.on('typing', (data) => {
    feedback.innerHTML = '<p><em>' +data+ ' is typing a message...</em></p>';
    setTimeout(() => {
        feedback.innerHTML = '';
    }, 3000);
});

socket.on('register-acc', (data) => {
    if (data === true) {
        username = regUser.value;
        loginSuccess();
    }
    else {
        regUserLabel.style.color = "red";
        regPassLabel.style.color = "#575ed8";
        regUserLabel.innerHTML = "Username - already in use";
        regPassLabel.innerHTML = "Password";
    }
});

socket.on('login-attempt', (data) => {
    if (data === true) {
        username = logUser.value;
        loginSuccess();
    }
    else {
        logPassLabel.style.color = "red";
        logUserLabel.style.color = "red";
        logPassLabel.innerHTML = "Password - incorrect login";
        logUserLabel.innerHTML = "Username - incorrect login";
    }
});

socket.on('user-connected', (data) => {
    userList.innerHTML = createUserList(data);
});


socket.on('user-disconnected', (data) => {
    userList.innerHTML = createUserList(data);
});

// Helper functions
function openChat(evt, chatName) {
    var i, tabcontent, tablinks;
    curChat = chatName;
  
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    document.getElementById(chatName).style.display = "block";
    evt.currentTarget.className += " active";
} 

function sendMessage(e) {
    socket.emit('message', {
        channel: curChat,
        message: message.value,
        username: username
    });
    message.value = "";
    feedback.innerHTML = '';
    setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 100);
}

function createUserList(users) {
    var final = "";
    users.forEach((user) => {
        if (user === username) {
            final += '<p><strong>' +user+ '</strong></p>';
        }
        else {
            final += '<p>' +user+ '</p>';
        }
    });
    return final;
}

function loginSuccess() {
    modal.style.display = "none";
    socket.emit('user-connected', username);
}