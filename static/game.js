// Dependencies
var socket = io();
//var Processing = require('processing');
var messages = document.getElementById('messages');
var lScreen = document.getElementById('login');
socket.on('message', function(data) {
  messages.innerHTML += "<div class='message'>"+data+"</div>";
});
socket.on('news', function(data) {
  messages.innerHTML += "<div class='message news'>"+data+"</div>";
});
socket.on('alert', function(data) {
  messages.innerHTML += "<div class='message alert'>"+data+"</div>";
});

var e = false;

var pData = {
  name: undefined,
  target: undefined,
  hunter: undefined,
  dead: false,
  kills: 0,
  up: false,
  down: false,
  left: false,
  right: false,
  x: 0,
  y: 0
}

var lastData = {}; // Stores the last data recieved, for the target

document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 65: // A
      pData.left = true;
      break;
    case 87: // W
      pData.up = true;
      break;
    case 68: // D
      pData.right = true;
      break;
    case 83: // S
      pData.down = true;
      break;
    case 37: // left
      pData.left = true;
      break;
    case 38: // up
      pData.up = true;
      break;
    case 39: // right
      pData.right = true;
      break;
    case 40: // down
      pData.down = true;
      break;
    case 32: // Spacebar (to tag)
      tag();
      //socket.emit('message', 'test');
      break
    case 18: // CTRL = invis to hunter
      socket.emit('i');
      console.log('iiiiiii');
      break;
    case 80: // P to see enemy
      e=true;
      console.log('eeeeeee');
  }
});
document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 65: // A
      pData.left = false;
      break;
    case 87: // W
      pData.up = false;
      break;
    case 68: // D
      pData.right = false;
      break;
    case 83: // S
      pData.down = false;
      break;
    case 37: // left
      pData.left = false;
      break;
    case 38: // up
      pData.up = false;
      break;
    case 39: // right
      pData.right = false;
      break;
    case 40: // down
      pData.down = false;
      break;
  }
});

function connect() {
  document.getElementById('connectBtn').disabled = true;
  document.getElementById('playername').disabled = true;
  document.getElementById('reconnect').disabled = true;
  lScreen.style.display = 'none';
  pData.name=document.getElementById('playername').value.substring(0, 11);
  socket.emit('new player', pData);
  setInterval(function() {
    socket.emit('data', pData);
  }, 1000 / 60);
}

function reconnect() {
  document.getElementById('connectBtn').disabled = true;
  document.getElementById('playername').disabled = true;
  document.getElementById('reconnect').disabled = true;
  lScreen.style.display = 'none';
  pData.name=document.getElementById('playername').value.substring(0, 11);
  pData.dead=false;
  socket.emit('old player', pData);
}

function tag() {
  //console.log(pData.x, pData.y, lastData.x, lastData.y);
  var a = pData.x - lastData.x;
  var b = pData.y - lastData.y;
  var dist = Math.sqrt( a*a + b*b );
  //console.log(dist);
  if (dist < 50 && pData.dead == false) {
    toKill = pData.target;
    pData.target = lastData.target;
    socket.emit('kill', toKill);
  }
}

function send() {
  msg = document.getElementById('msg');
  sendBtn = document.getElementById('send');
  socket.emit('message', '['+pData.name+'] '+msg.value);
  msg.value = '';
}

function circle(x, y, radius, context, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fill();
}

// Collision detection
function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

var canvas = document.getElementById('canvas');
var scores = document.getElementById('scores');
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext('2d');
context.font = "10px consolas";
socket.on('state', function(players) {
  scores.innerHTML = '';
  for (id in players) {
    var end='';
    var c="class='message'";
    var k = players[id].kills;
    if (k > 4) {
      end = '<br>RAMPAGE!';
      c="class='news'";
    }
    if (k > 9) {
      end = '<br>KILLING SPREE!';
      c="class='alert'";
    }
    scores.innerHTML += "<div "+c+">"+players[id].name+" : "+players[id].kills+end+"</div>";
  }
  if (pData.name != undefined && pData.target != undefined) {
    pData.x = players[socket.id].x;
    pData.y = players[socket.id].y;
    pData.kills = players[socket.id].kills;
    lastData = players[pData.target];
    //console.log(lastData.name);
  }
  context.clearRect(0, 0, 800, 600);
  for (var id in players) {
    var player = players[id];
    //console.log(players[id].name);
    if (id == socket.id) {
      context.fillStyle = 'blue';
      context.beginPath();
      context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
      context.fill();
      context.fillText("(You)", player.x-12, player.y-15);
    }else if (id == pData.target && !players[id].i){
      context.fillStyle = 'orange';
      context.beginPath();
      context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
      context.fill();
      context.fillText(player.name, player.x-5, player.y-15);
    }else {
      if (id == pData.hunter && e) {
        context.fillStyle = 'red';
        context.beginPath();
        context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
        context.fill();
        context.fillText(player.name, player.x-5, player.y-15);
      } else if (id !== pData.target) {
        context.fillStyle = 'green';
        context.beginPath();
        context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
        context.fill();
        context.fillText("(You)", player.x-12, player.y-15);
      }
    }
  }
});
socket.on('targets', function(data) {
  pData.target = data[socket.id];
  for (k in data) {if (data[k] == socket.id) {pData.hunter = k}}
});

socket.on('killed', function(data) {
  if (data == socket.id) {
    document.getElementById('reconnect').disabled = false;
    pData.dead = true;
    //console.log('Kills : '+pData.kills);
    //socket.disconnect();
  }
});
