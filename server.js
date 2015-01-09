var fs = require('fs'),
    http = require('http'),
    path = require('path'),
    mime = require('mime'),
    cache = {};

function send404(response) {
    response.writeHead(404, {
        'Content-Type': 'text/plain'
    });
    response.write('Error 404: resource not found.');
    response.end();
}

function sendFile(response, filePath, fileContents) {
    response.writeHead(200, {
        "content-type": mime.lookup(path.basename(filePath))
    });
    response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    } else {
        fs.exists(absPath, function(exists) {
            if (exists) {
                fs.readFile(absPath, function(err, data) {
                    if (err) {
                        send404(response);
                    } else {
                        sendFile(response, absPath, data);
                    }
                });
            } else {
                send404(response);
            }
        });
    }
}

var server = http.createServer(function(request, response) {
    var filePath;
    if (request.url === '/') {
        filePath = 'public/index.html';
    } else {
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath);
});

server.listen(3000, function() {
    console.log('Server is listening on port 3000.');
});

var chatServer = require('./lib/chat_server'); //Logic to handle socket.io based server-side chat functionality
chatServer.listen(server); //Listen method is defined in chat_server.js