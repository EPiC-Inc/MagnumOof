// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var stdin = process.openStdin();
var server = http.Server(app);
var io = socketIO(server);
var port = 80;
var targetDelay = 500;//ms
// Set the port, default 80
if (process.argv[2] == undefined) {
  port = 80;
} else {
var port = process.argv[2]; // Use node server.js <port>
}
app.set('port', port);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Callbacks
stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then trim()
    io.sockets.emit("alert", "(SERVER ALERT) : " +
        d.toString().trim());
  });

// Starts the server.
server.listen(port, function() {
  console.log('Starting server on port '+port);
});

// Functions
function assignTargets() {
  for (player in players) {
  }
}
function shift(array) {
  //console.log('Start');
  //console.log(array);
  var currentIndex = array.length;
  var temporaryValue, randomIndex;

  array.unshift(array.pop());
  //console.log('End');
  //console.log(array);
  return array;
}

function shuffleTargets() {
  var arr = [];
  var data = {};
  for (var key in players) {
    arr.push(key);
  }
  var i = 0;
  arr = shift(arr);
  for (var key in players) {
    //console.log(key);
    data[String(key)] = arr[i];
    //console.log("DATA:");
    //console.log(data);
    i++;
  }
  io.sockets.emit('targets', data);
}
// Add the WebSocket handlers
var players = {};
io.on('connection', function(socket) {
  socket.on('new player', function(data) {
    io.sockets.emit("news", "Player '"+data.name+"' joined"); //When a player joins
    players[socket.id] = {
      name: data.name,
      target: undefined,
      hunter: undefined,
      dead: false,
      kills: 0,
      x: Math.floor(Math.random() * 7) * 100 + 100,
      y: Math.floor(Math.random() * 5) * 100 + 100,
      i: false
    };
    setTimeout(shuffleTargets, targetDelay);
  });
  socket.on('old player', function(data) {
    //io.sockets.emit("message", "Player '"+data.name+"' respawned"); //When a player (re)joins
    players[socket.id] = {
      name: data.name,
      target: undefined,
      hunter: undefined,
      dead: false,
      kills: 0,
      x: Math.floor(Math.random() * 7) * 100 + 100,
      y: Math.floor(Math.random() * 5) * 100 + 100,
      i: false
    };
    setTimeout(shuffleTargets, targetDelay);
  });
  socket.on('data', function(data) {
    var player = players[socket.id] || {};
    if (data.left) {
      player.x -= 5;
    }
    if (data.up) {
      player.y -= 5;
    }
    if (data.right) {
      player.x += 5;
    }
    if (data.down) {
      player.y += 5;
    }
    player.x = Math.min(Math.max(parseInt(player.x), 0), 800); // Constrain player x
    player.y = Math.min(Math.max(parseInt(player.y), 0), 600); // Constrain player y
  });
  socket.on('disconnect', function() {
    if (players[socket.id] == undefined) {
      //console.log('error');
    }else{
      io.sockets.emit("news", "Player '"+players[socket.id].name+"' left")
      delete players[socket.id];
      setTimeout(shuffleTargets, targetDelay);
    }
  });
  socket.on('message', function(data) {
    io.sockets.emit("message", data);
  });
  socket.on('i', function() {
    players[socket.id].i = true;
  });
  socket.on('kill', function(data) {
    //console.log(players);
    if (socket.id !== data && data !== undefined && players[data] !== undefined) {
      if (players[socket.id] !== undefined) {
        players[socket.id].kills += 1;
      }
      io.sockets.emit('killed', data);
      delete players[data];
      setTimeout(shuffleTargets, targetDelay);
    }
  });
});
setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);
