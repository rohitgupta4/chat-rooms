var Chat = function(socket) {
    this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text) {
    this.socket.emit('clientMessage', {
        room: room,
        text: text
    });
};

Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join', {
        newRoom: room
    });
};

Chat.prototype.changeName = function(name) {
    this.socket.emit('nameAttempt', name);
};

Chat.prototype.processCommand = function(command) {
    var words = command.split(' ');
    var cmd = words[0].substring(1, words[0].length).toLowerCase();

    if (cmd === 'join') {
        words.shift();
        this.changeRoom(words.join(' '));
        return true;
    } else if (cmd === 'nick') {
        words.shift();
        this.changeName(words.join(' '));
        return true;
    } else {
        return false;
    }
};

