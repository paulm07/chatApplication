// Vania Jarquin
//

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// Holds session object for entire session of server's existence (persistent data)
var chatSession = require('./chat-session');
// Holds commands object to handle user's command requests
var commands = require('./chat-commands')(io, chatSession);
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



// FINISH SOON //

//To send the nickname
//io is for the server
io.on('connection', function(socket){



  /* HANDLES USERNAME REGISTRATION */
  //socket is for the client
  socket.on('new user', function(data, callback){




    if (nicknames.indexOf(data) != -1){
      /* Gives users a random nickname if the username is already chosen */
      callback(false);
      socket.nickname = data + Math.floor((Math.random() * 1000) + 1000);
      nicknames.push(socket.nickname);


      // Registers User to Channel //
      

      updateNicknames();

      //nickname becomes nickname plus random number
    }
    else{
      callback(true);
      socket.nickname = data; // storing nickname of each user within socket itself
      nicknames.push(socket.nickname);
      updateNicknames();
    }



    /* HANDLES USERNAME REGISTRATION */






});




// FINISH SOON




/**
 * Handles updating nickname list for all users
 */
function updateNicknames(){
  io.sockets.emit('usernames', nicknames);
}






/**
 * Handles sending information to form
 */
socket.on('send message', function(data){
  if(!commands.isCommand(data))
  {
    io.sockets.emit('new message', {msg: data, nick: socket.nickname});
    //chatSession.log()
  }
  else {

  }
  //TO BROADCAST socket.BROADCAST.emit('new message', data);
});




socket.on('disconnect', function(data){
  if(!socket.nickname) return;
  nicknames.splice(nicknames.indexOf(socket.nickname), 1);
  updateNicknames();
});
});
