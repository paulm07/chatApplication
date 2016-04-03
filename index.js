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


  // Handles initialization of server to add SysOP and initial Channels when first user logs in


  if(chatSession.count == 0)
  {
    // Once sysOP logs in with correct password, socket of user which logged
    // as sysOP will be set as sysOP's socket
    chatSession.users["sysop"] = {
      nickname: "sysOP",
      //tabs: 0,
      accessLevel: 0,
      socket: null

    };

    // Initilizes main system chat rooms once the first user logs in
    chatSession.channel["##Main"] = {currentUsers: ["sysop"], log: ""};
    chatSession.channel["##FIU"] = {currentUsers: [], log: ""};
    chatSession.channel["##WebAppDevelopment"] = {currentUsers: [], log: ""};

    // Adds sysOP to the user list and adds appropriate flair
    nicknames.push("*" + chatSession.users["sysop"].nickname);
  }





  /* START USERNAME REGISTRATION */

  //socket is for the client
  socket.on('new user', function(data, callback){


    // Handles whether nickname exists or not. If the nickname exists at
    // registration, the nickname will be accepted but appended with a random
    // number between and 9999
    if (nicknames.indexOf(data) != -1){
      /* Gives users a random nickname if the username is already chosen */
      callback(false);
      socket.nickname = data + Math.floor((Math.random() * 1000) + 1000);
      nicknames.push(socket.nickname);

      // Creates a new user with regular access level and chosen nickname
      chatSession.users[socket.nickname] = {
        nickname: socket.nickname,
        //tabs: 0,
        accessLevel: 2,
        socket: socket
      };


      // Registers User to Channel //


      // Will send channelList to users REMEMBER TO COMMENT OUT
      socket.emit('updateChannelList', chatSession.channel)
      // Increases chat count with new registration
      chatSession.count++;
      updateNicknames();
      //nickname becomes nickname plus random number
    }
    else{
      callback(true);
      socket.nickname = data; // storing nickname of each user within socket itself
      nicknames.push(socket.nickname);

      /* chatSession will hold user by username */
      chatSession.users[socket.nickname] = {
        nickname: socket.nickname,
        accessLevel: 2,
        //tabs: 0,
        socket: socket
      };

      // Will send channelList to users REMEMBER TO COMMENT OUT
      socket.emit('updateChannelList', chatSession.channel)
      // Increases chat count with new registration
      chatSession.count++;
      // End of chat session adding user
      updateNicknames();
    }



  /* END USERNAME REGISTRATION */



});




// FINISH SOON




/**
 * Handles updating nickname list for all users
 */
function updateNicknames(){
  io.sockets.emit('usernames', nicknames);
}




// HANDLES UPDATING CHAT MESSAGES

/**
 * Handles user changing their channel with element
 */
socket.on('updateChatMessages', function(newChannel){
  // Find a way to
  chatSession.users[socket.nickname].currentChannel = newChannel;

  socket.emit('');

});





/**
 * Handles sending information to form
 */
socket.on('send message', function(data){
  if(!commands.isCommand(data))
  {

    // CREATE LOOP FOR CHANNEL USERLIST
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
  chatSession.count--;
  updateNicknames();
});
});
