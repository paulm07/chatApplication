// Vania Jarquin
//

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
nicknames = [];

http.listen(3000, function(){
  console.log('listening on *:3000');
});

//Creating route to root dir REQUEST RESPONSE
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// To print on console when a user is connected and disconnected
/* io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});*/

//To send the nickname
//io is for the server
io.on('connection', function(socket){
  //socket is for the client
  socket.on('new user', function(data, callback){
    if (nicknames.indexOf(data) != -1){
      /* Gives users a random nickname if the username is already chosen */
      callback(false);
      socket.nickname = data + Math.floor((Math.random() * 1000) + 1000);;
      nicknames.push(socket.nickname);
      updateNicknames();

      //nickname becomes nickname plus random number
    }
    else{
      callback(true);
      socket.nickname = data; // storing nickname of each user within socket itself
      nicknames.push(socket.nickname);
      updateNicknames();
    }
});

function updateNicknames(){
  io.sockets.emit('usernames', nicknames);
}

//To send message to FORM (chat room)
socket.on('send message', function(data){
  io.sockets.emit('new message', {msg: data, nick: socket.nickname});
  //TO BROADCAST socket.BROADCAST.emit('new message', data);
});

socket.on('disconnect', function(data){
  if(!socket.nickname) return;
  nicknames.splice(nicknames.indexOf(socket.nickname), 1);
  updateNicknames();
});
});
