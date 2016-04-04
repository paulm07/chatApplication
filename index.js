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
    chatSession.users["sysOP"] = {
      nickname: "sysOP",
      //tabs: 0,
      accessLevel: 0,
      socket: null,
      currentChannel: "main"

    };

    // Initilizes main system chat rooms once the first user logs in
    chatSession.channels["main"] = {accessLevel: 0, accessType: "public", accessList: ["sysOP"], currentUsers: {}, log: "<h3>--Welcome to the <b>##main</b> channel--</h3>\n"};
    chatSession.channels["fiu"] = {accessLevel: 0, accessType: "public", accessList: ["sysOP"], currentUsers: {}, log: "<h3>--Welcome to the <b>##fiu</b> channel--</h3>\n"};
    chatSession.channels["webappdevelopment"] = {accessLevel: 0, accessType: "public", accessList: ["sysOP"], currentUsers: {}, log: "<h3>--Welcome to the <b>##webappdevelopment</b> channel--</h3>\n"};

    // Handles switching sysOP to main channel from the beginning
    // Should probably switch to a function to avoid emitting
    chatSession.channels["main"].currentUsers["sysOP"] = true;
    chatSession.users["sysOP"].currentChannel = "main";
    //console.log(chatSession.users["sysOP"]);

    // Adds sysOP to the user list and adds appropriate flair
    nicknames.push("*" + chatSession.users["sysOP"].nickname);
  }





  /* START USERNAME REGISTRATION PROTOCOL*/

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
        socket: socket,
        currentChannel: "main"
      };


      // BEGIN USER REGISTRATION WITH SAME NAME

      // Will have user join ##main as default
      chatSession.channels["main"].currentUsers[socket.nickname] = true;
      chatSession.users[socket.nickname].currentChannel = "main";

      // Will send channelList to users REMEMBER TO COMMENT OUT
      initializeChannelList(chatSession.users[socket.nickname].socket);

      // Increases chat count with new registration
      chatSession.count++;

      // Updates nick names
      updateNicknames();

      // Adds intial ##main log when signed in
      io.to(socket.id).emit('updateChatLog', chatSession.channels['main'].log);


      // ENDS USER REGISTRATION WITH SAME NAME

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
        socket: socket,
        currentChannel: "main"
      };

      // BEGIN REGISTRATION OF USER WITH UNIQUE NAME

      // Will have user join ##main as default
      chatSession.channels["main"].currentUsers[socket.nickname] = true;
      chatSession.users[socket.nickname].currentChannel = "main";

      // Will send channelList to users **REMEMBER TO UNCOMMENT**
      initializeChannelList(chatSession.users[socket.nickname].socket);

      // Increases chat count with new registration
      chatSession.count++;

      // End of chat session adding user
      updateNicknames();

      // Adds intial ##main log when signed in
      io.to(socket.id).emit('updateChatLog', chatSession.channels['main'].log);

      // END REGISTRATION OF USER WITH UNIQUE NAME
    }



  /* END USERNAME REGISTRATION PROTOCOL */



});

// Will add a channel based on access level
socket.on('createChannel', function(channelName){
  // Only moderators and admin can initially join this channel unless otherwise specified by user
  if(chatSession.users[socket.nickname].accessLevel === 0)
  {
    var newChannelWelcomeMessage = "<h3>--Welcome to the <b>##"+ channelName + "</b> channel--</h3>\n";
    chatSession.channels[channelName] = {accessLevel: 0, accessType: "public", accessList: ["sysop", socket.nickname], currentUsers: {}, log: newChannelWelcomeMessage};
  }
  else if(chatSession.users[socket.nickname].accessLevel == 1)
  {
    var newChannelWelcomeMessage = "<h3>--Welcome to the <b>##"+ channelName + "</b> channel--</h3>\n";
    chatSession.channels[channelName] = {accessLevel: 1, accessType: "public", accessList: ["sysop", socket.nickname], currentUsers: {}, log: newChannelWelcomeMessage};
  }
  // Everyone can join this as it was created by a user
  else {
    var newChannelWelcomeMessage = "<h3>--Welcome to the <b>#"+ channelName + "</b> channel--</h3>\n";
    chatSession.channels[channelName] = {accessLevel: 2, accessType: "public", accessList: ["sysop", socket.nickname], currentUsers: {}, log: newChannelWelcomeMessage};
  }

  updateAllChannelLists();

});

socket.on('addPrivateChannel', function(otherUsersName){
    chatSession.channels[socket.nickname + '-' + otherUsersName] = {accessLevel: 2, accessType: "public", accessList: ["sysop", socket.nickname], currentUsers: {}, log: ""};
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


// Will handle sending list of public channels to specific user
function initializeChannelList(socket)
{
  var updatedChannelList = {};

  for(line in chatSession.channels)
  {
    // Will only send channels which are public to the entire
    if(chatSession.channels[line].accessType == "public")
    {
      // Signifies that the channel list, indeed, exists and adds the instance
      // field to the object
      //updatedChannelList[line] = true;

      // Handles adding the appropriate hashtags to channels
      if(chatSession.channels[line].accessLevel <= 1) { // CREATED BY ADMIN/MOD
        updatedChannelList["##" + line] = true;
      }
      else { // CREATED BY REGULAR USER
        updatedChannelList["#" + line] = true;
      }
    }
  }

  // console.log(updatedChannelList);
  socket.emit('updateChannelList', updatedChannelList);
}


// Will handle sending list of public channels to specific user
function updateAllChannelLists()
{
  var updatedChannelList = {};

  for(line in chatSession.channels)
  {
    // Will only send channels which are public to the entire
    if(chatSession.channels[line].accessType == "public")
    {
      // Signifies that the channel list, indeed, exists and adds the instance
      // field to the object
      //updatedChannelList[line] = true;

      // Handles adding the appropriate hashtags to channels
      if(chatSession.channels[line].accessLevel <= 1) { // CREATED BY ADMIN/MOD
        updatedChannelList["##" + line] = true;
      }
      else { // CREATED BY REGULAR USER
        updatedChannelList["#" + line] = true;
      }
    }
  }

  // console.log(updatedChannelList);
  io.emit('updateChannelList', updatedChannelList);
}


/**
 * Handles sending information to form
 */
socket.on('send message', function(data){
  if(!commands.isCommand(data))
  {
    // Holds the channel in which the user sent the message
    var currentChannel = chatSession.users[socket.nickname].currentChannel;

    // Adds the current message to the log of the channel as it would be displayed by the user
    // This also takes care of making sure that the user send their chat message to the correct channel
    chatSession.channels[currentChannel].log += '<b>' + socket.nickname + ': </b>' + data + '\n';

    // Make sure to handle messaging ONLY those people in this current channel though LOOP!
    for(user in chatSession.channels[chatSession.users[socket.nickname].currentChannel].currentUsers)
    {
      if(chatSession.users[user].socket === null) {
        // HANDLES SYSOP NOT HAVING ITS SOCKET YET
      }
      else{
      io.to(chatSession.users[user].socket.id).emit('new message', {msg: data, nick: socket.nickname});
    }
    }
  }
  else {
    commands.run(chatSession.users[socket.nickname], data);
  }
  //TO BROADCAST socket.BROADCAST.emit('new message', data);
});



/**
 * Handles switching a user from one channel to another
 *
 * SECURITY CHECKS TO BE ADDED LATER
*/
socket.on('switchUsersChannel', function(user, newChannelName){
  // Handles removing user from previous channel
  console.log(user + " " + newChannelName);
  //console.log(chatSession.users[user]);
  var oldChannel = chatSession.users[user].currentChannel;
  console.log(oldChannel);
  // Removes user from channel list for easier distribution of messages
  delete chatSession.channels[oldChannel].currentUsers[user];

  // Handles adding user to new channel's current users list
  chatSession.channels[newChannelName].currentUsers[user] = true;

  // Changes user's current channel to the new one
  chatSession.users[user].currentChannel = newChannelName;

  //console.log(chatSession.channels[newChannelName].log);

  // Updates user's current chatlog to the correct one
  io.to(chatSession.users[user].socket.id).emit('updateChatLog', chatSession.channels[newChannelName].log);
});




socket.on('disconnect', function(data){
  if(!socket.nickname) return;
  nicknames.splice(nicknames.indexOf(socket.nickname), 1);
  // Keeps SysOP from being added more than once
  // SysOP keeps the count permanently @ 1 once server is initialized
  if(chatSession.count == 1)
  {
    chatSession.count = 1;
  }
  else
  {
    chatSession.count--;
  }

  updateNicknames();
});
});
