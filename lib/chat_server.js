var socketio = require('socket.io'),
    io,
    guestNumber = 1,
    nicknames = {}, //To keep track of name per socket connection
    namesUsed = [],
    currentRoom = {}; //To keep track of room per socket connection

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 1);

    io.sockets.on('connection', function(socket) {
        guestNumber = assignGuestNameAndIncrementGuestNumber(socket, guestNumber, nicknames, namesUsed);

        joinRoom(socket, 'Lobby');

        handleMessageBroadcasting(socket, nicknames);

        handleNameChangeAttempts(socket, nicknames, namesUsed);

        handleRoomJoining(socket);

        socket.on('rooms', function() {
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        handleClientDisconnect(socket, nicknames, namesUsed);
    });
};

function handleClientDisconnect(socket, nicknames, namesUsed) {
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nicknames[socket.id]);
        delete nicknames[socket.id];
        delete namesUsed[nameIndex];
        delete currentRoom[socket.id];
    });
}

function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

function handleMessageBroadcasting(socket, nicknames) {
    socket.on('clientMessage', function(message) {
        socket.broadcast.to(message.room).emit('serverMessage', {
            message: nicknames[socket.id] + ': ' + message.text
        });
    });
}

function assignGuestNameAndIncrementGuestNumber(socket, guestNumber, nicknames, namesUsed) {
    var name = 'Guest' + guestNumber;
    nicknames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        message: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {
        success: true,
        message: room
    }); //This only informs the current user
    socket.broadcast.to(room).emit('message', { //Broadcast to rest of the room members
        message: nicknames[socket.id] + 'has joined ' + room + '.'
    });
}

function handleNameChangeAttempts(socket, nicknames, namesUsed) {
    socket.on('nameAttempt', function(name) {
        if (name.indexOf('Guest') === 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot start with \"Guest.\"'
            });
        } else {
            if (namesUsed.indexOf(name) === -1) {
                var prevName = nicknames[socket.id];
                var prevIndex = namesUsed.indexOf(prevName);
                namesUsed[prevIndex] = name;
                nicknames[socket.id] = name;
                socket.emit('nameResult', {
                    success: true,
                    message: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: prevName + 'has updated their name to ' + name + '.'
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    });
}