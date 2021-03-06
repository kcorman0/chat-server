const socket = io.connect('http://localhost:3000');
let username = "";
let curChannel = 'general-channel';
const message = document.getElementById('message'),
    chatWindow = document.getElementById('chat-window'),
    sendBtn = document.getElementById('send'),
    feedback = document.getElementById('feedback'),
    userList = document.getElementById('user-list'),
    loginModal = document.getElementById('login-modal'),
    loginClose = document.getElementById('login-close'),
    loginBtn = document.getElementById('log-btn'),
    logUserLabel = document.getElementById('log-user-label'),
    logUser = document.getElementById('log-user'),
    logPassLabel = document.getElementById('log-pass-label'),
    logPass = document.getElementById('log-pass'),
    registerBtn = document.getElementById('reg-btn'),
    regUserLabel = document.getElementById('reg-user-label'),
    regUser = document.getElementById('reg-user'),
    regPassLabel = document.getElementById('reg-pass-label'),
    regPass = document.getElementById('reg-pass'),
    channelModal = document.getElementById('channel-modal'),
    channelClose = document.getElementById('channel-close'),
    channelName = document.getElementById('channel-name'),
    createChannelBtn = document.getElementById('create-channel-btn'),
    tabs = document.getElementById('tabs'),
    newTabBtn = document.getElementById('new-tab');

// Events

// Send message
message.addEventListener('keydown', ({key}) => {
    if (key === "Enter") {
        if (username === "") {
            loginModal.style.display = 'block';
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
        loginModal.style.display = 'block';
    }
    else {
        sendMessage();
    }
});

// Register
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

// Login
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

// Create new channel
createChannelBtn.addEventListener('click', () => {
    socket.emit('create-channel', {
        channel: channelName.value
    });
});

channelName.addEventListener('keydown', ({key}) => {
    if (key === "Enter") {
        socket.emit('create-channel', {
            channel: channelName.value
        });
    }
});

// Close window
loginClose.addEventListener('click', () => {
    loginModal.style.display = "none";
});

channelClose.addEventListener('click', () => {
    channelModal.style.display = "none";
})


// Socket.io responses
socket.on('message', (data) => {
    displayMessage(data.channel, data.username, data.message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    feedback.innerHTML = '';
});

socket.on('load-messages', (data) => {
    data.messages.forEach((entry) => {
        displayMessage(data.channel, entry.username, entry.message);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

socket.on('typing', (data) => {
    feedback.innerHTML = '<p><em>' +data+ ' is typing a message...</em></p>';
    setTimeout(() => {
        feedback.innerHTML = '';
    }, 3000);
});

socket.on('create-channel', (data) => {
    createChannel(data.channel);
    channelModal.style.display = "none";
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
function sendMessage(e) {
    socket.emit('message', {
        channel: curChannel,
        message: message.value,
        username: username
    });
    message.value = "";
    feedback.innerHTML = '';
}

function displayMessage(channel, user, message) {
    const msgChannel = document.getElementById(channel);
    if (!msgChannel) {
        createChannel(channel.slice(0, -8));
    }
    if (user === username) {
        document.getElementById(channel).innerHTML += '<b><p><strong>' +user+ ': </strong>' +message+ '</p></b>';
    }
    else {
        document.getElementById(channel).innerHTML += '<p><strong>' +user+ ': </strong>' +message+ '</p>';
    }
}

function createUserList(users) {
    let final = "";
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
    loginModal.style.display = "none";
    socket.emit('user-connected', username);
}

function openChannel(evt, chatName) {
    curChannel = chatName;
  
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  
    document.getElementById(chatName).style.display = "block";
    evt.currentTarget.className += " active";
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function createChannel(channel) {
    const newTab = document.createElement('button');
    newTab.className = "tablinks";
    newTab.innerHTML = channel.toLowerCase();
    newTab.onclick = () => { openChannel(event, channel + "-channel"); };
    tabs.insertBefore(newTab, newTabBtn);

    const newChannel = document.createElement('div');
    newChannel.id = channel + "-channel";
    newChannel.className = "tabcontent";
    chatWindow.insertBefore(newChannel, feedback);
}

function showChannelModal() {
    if (username !== "") {
        channelModal.style.display = "block";
    }
    else {
        loginModal.style.display = 'block';
    }
}