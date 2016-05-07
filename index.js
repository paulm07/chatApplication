/**
 * @author: Paul Molina
 * @author: Vania Jarquin
 *
 * This file handles the server's function in the chat program. The users never
 * actually interact with the server.
 *
 * Chat Program #3
 */



 /* Web Socket Addition */
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8181});
 /* End Web Socket Addition */




/* Mongoose Addition */
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chat');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'))
db.once('open', function(){
  console.log("--Mongoose successfully connected--");
});
/* End Mongoose Addition */

/* Weather Service Addition */
var weather = require('weather-js');

weather.find({search: 'San Francisco, CA', degreeType: 'F'}, function(err, result) {
  if(err) console.log(err);

  console.log(JSON.stringify(result, null, 2));
});


/* Mongoose Scheme for Chat Messages */
var chatLogSchema = mongoose.Schema({
  channel: String,
  log: String
});




/* Create the model for all chat messages */
var ChatLog = mongoose.model('chatLog', chatLogSchema, 'chatLog');


// Mongoose Testing

// var aChatLog = new ChatLog({
//   channel: 'main',
//   log: 'hi!'
// });
//
// aChatLog.save(function (err, aChatLog){
//   if (err) return console.error(err);
// });






var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// Holds session object for entire session of server's existence (persistent data)
var chatSession = require('./chat-session');
// Holds commands object to handle user's command requests
var commands = require('./chat-commands')(io, chatSession);
var sysopName = "";
nicknames = [];

http.listen(3000, function(){
  console.log('listening on *:3000');
});





/* LOGIC FOR WEB SERVICE, MONGO AND WEBSOCKET */

wss.on('connection', function(ws) {
  console.log('client has connected');
  ws.on('message', function(message){
    console.log(message);

    processedMessage = message.split(" ");

    if(processedMessage[0] == '\\:Time')
    {
      ws.send("<b>The current time and date on the server is: " + Date() + "</b>");
      //console.log("Getting the message");

    }
    else if(processedMessage[0] == '\\:Weather')
    {
      var cityToLookFor = processedMessage[1];
      console.log(cityToLookFor);

      weather.find({search: cityToLookFor, degreeType: 'F'}, function(err, forecast) {
        if(err)
        {
          console.log(err);
          ws.send("<b>Error ProcessingCity</b>\n");
        }
        else {
          console.log(forecast);
          ws.send("<b>Forcast for " + forecast[0].location.name +
          ": Temperature - " + forecast[0].current.temperature +
            "F, Current State - " + forecast[0].current.skytext +
          "</b>\n");
        }


        //console.log(JSON.stringify(result, null, 2));
      });

    }
    else if(processedMessage[0] == '\\:Jemes')
    {

    }
    else if(!commands.isCommand(message))
    {

    }

  });
});

/* END LOGIC FOR WEB SERVICE, MONGO AND WEBSOCKET */

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
}); */



// FINISH SOON //

//To send the nickname
//io is for the server
io.on('connection', function(socket){


  // Handles initialization of server to add SysOP and initial Channels when first user logs in


  if(chatSession.count == 0)
  {
    // Once sysOP logs in with correct password, socket of user which logged
    // as sysOP will be set as sysOP's socket
    // chatSession.users["sysOP"] = {
    //   nickname: "sysOP",
    //   //tabs: 0,
    //   accessLevel: 0,
    //   isModerator: false,
    //   socket: null,
    //   currentChannel: "main"
    //
    // };

    // Initilizes main system chat rooms once the first user logs in
    chatSession.channels["main"] = {accessLevel: 0, accessType: "public", accessList: ["sysOP"], currentUsers: {}, log: "<h3>--Welcome to the <b>##main</b> channel--</h3>\n"};
    //chatSession.channels["fiu"] = {accessLevel: 0, accessType: "public", accessList: ["sysOP"], currentUsers: {}, log: "<h3>--Welcome to the <b>##fiu</b> channel--</h3>\n"};
    //chatSession.channels["webappdevelopment"] = {accessLevel: 0, accessType: "public", accessList: ["sysOP"], currentUsers: {}, log: "<h3>--Welcome to the <b>##webappdevelopment</b> channel--</h3>\n"};

    // Initializes sysbot
    chatSession.users['sysbot'] = {
      nickname: 'sysbot',
      //tabs: 0,
      accessLevel: 0,
      isModerator: false,
      socket: socket,
      currentChannel: "main"
    };

    // Initializes smartbot
    chatSession.users['smartbot'] = {
      nickname: 'smartbot',
      //tabs: 0,
      accessLevel: 0,
      isModerator: false,
      socket: socket,
      currentChannel: "main"
    };
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
        isModerator: false,
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
    chatSession.channels[channelName] = {accessLevel: 0, accessType: "public", accessList: ["sysop", "smartbot", "sysbot", socket.nickname], currentUsers: {}, log: newChannelWelcomeMessage};

    // Handles Creating chatlog for new channel
    var aChatLog = new ChatLog({
      channel: channelName,
      log: ''
    });

    aChatLog.save(function (err, aChatLog){
      if (err) return console.error(err);
    });
  }
  else if(chatSession.users[socket.nickname].accessLevel == 1)
  {
    var newChannelWelcomeMessage = "<h3>--Welcome to the <b>##"+ channelName + "</b> channel--</h3>\n";
    chatSession.channels[channelName] = {accessLevel: 1, accessType: "public", accessList: ["sysop", "smartbot", "sysbot", socket.nickname], currentUsers: {}, log: newChannelWelcomeMessage};

    // Handles Creating chatlog for new channel
    var aChatLog = new ChatLog({
      channel: channelName,
      log: ''
    });

    aChatLog.save(function (err, aChatLog){
      if (err) return console.error(err);
    });
  }
  // Everyone can join this as it was created by a user
  else {
    var newChannelWelcomeMessage = "<h3>--Welcome to the <b>#"+ channelName + "</b> channel--</h3>\n";
    chatSession.channels[channelName] = {accessLevel: 2, accessType: "public", accessList: ["sysop", "smartbot", "sysbot", socket.nickname], currentUsers: {}, log: newChannelWelcomeMessage};

    // Handles Creating chatlog for new channel
    var aChatLog = new ChatLog({
      channel: channelName,
      log: ''
    });

    aChatLog.save(function (err, aChatLog){
      if (err) return console.error(err);
    });
  }

  // Switch Users Channel to the correct one once they create it
  switchUsersChannel(socket.nickname, channelName);
  // Ensures that all channel lists are properly loaded
  updateAllChannelLists();
  // Ensures that user goes to correct place once
  io.to(socket.id).emit('updateSelector', channelName);


});









/**
 * Handles updating nickname list for all users. Takes into account whether users
 * are sysOP or moderators
 */
function updateNicknames(){
  //io.sockets.emit('usernames', nicknames);
  var formattedNickNames = [];

  for(var i = 0; i < nicknames.length; i++)
  {
    var currentName = nicknames[i];
    if(chatSession.users[currentName].accessLevel == 0)
    {
      formattedNickNames.push("*" + chatSession.users[currentName].nickname);
    }
    else if(chatSession.users[currentName].accessLevel == 1)
    {
      formattedNickNames.push("+" + chatSession.users[currentName].nickname);
    }
    else {
      formattedNickNames.push(chatSession.users[currentName].nickname);
    }
  }

  console.log(formattedNickNames);

  io.sockets.emit('usernames', formattedNickNames);
}



/**
* A broadcast sent by the sysOP sent through every channel.
*/
function broadcast(messageToBroadcast, sysopNickName)
{
  var messageToBroadcast = messageToBroadcast.substring(10);

  for(channel in chatSession.channels)
  {
    chatSession.channels[channel].log += '<i><b style="color: blue">' + "sysOP" + ': ' + messageToBroadcast + '</b></i>\n';
  }

  io.emit('new message', {msg: '**** ' + messageToBroadcast + ' ****</b></i>', nick: '<i><b style="color: blue">sysOP'});
}



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






// Used to create a private chat channel
socket.on('addPrivateChannel', function(otherUsersName){
    chatSession.channels[socket.nickname + '-' + otherUsersName] = {accessLevel: 2, accessType: "public", accessList: ["sysop", socket.nickname, otherUsersName], currentUsers: {sysbot: true, smartbot: true}, log: ""};
});






function privateMessage(message, otherUser, socket)
{
  var messageWithUsername = message.substring(message.indexOf(otherUser));

  var sanitizedMessage = messageWithUsername.substring(otherUser.length);

  chatSession.channels[socket.nickname + ' - ' + otherUser] = {accessLevel: 0, accessType: "private", accessList: ["sysop", socket.nickname, otherUser], currentUsers: {}, log: sanitizedMessage};

  if(otherUser == 'smartbot')
  {
    smartBotProcess(sanitizedMessage, socket);
  }
  else if(otherUser == 'sysbot')
  {
    sysBotProcess(sanitizedMessage, socket);
  }
  else {
    switchUsersChannel(socket.nickname, socket.nickname + ' - ' + otherUser);
    switchUsersChannel(otherUser, socket.nickname + ' - ' + otherUser);
  }
  // console.log(otherUser);

}



function sysBotProcess(message, socket)
{
  if(message == "help")
  {
    io.to(chatSession.users[socket.nickname].socket.id).emit('new messsage', {msg: '<br>/list <br>/list string <br>/msg <br>/nick <br>/quit <br>/join channel <br>/leave channel <br>/createChannel <br>removeChannel', msg: 'smartBot'});
  }
}






function switchUsersChannel(user, newChannelName)
{
  // Handles removing user from previous channel
  var oldChannel = chatSession.users[user].currentChannel;
  // Removes user from channel list for easier distribution of messages
  delete chatSession.channels[oldChannel].currentUsers[user];
  // Handles adding user to new channel's current users list
  chatSession.channels[newChannelName].currentUsers[user] = true;
  // Changes user's current channel to the new one
  chatSession.users[user].currentChannel = newChannelName;
  // Updates user's current chatlog to the correct one
  io.to(chatSession.users[user].socket.id).emit('updateChatLog', chatSession.channels[newChannelName].log);
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




socket.on('deleteChannel', function(channelToDelete){

  var channelUnderContention = chatSession.channels[channelToDelete];
  var userRequestingChannelDeletion = chatSession.users[socket.nickname];



  // If this fires off, the user does not have the proper rights to delete the channel
  if(channelUnderContention.accessLevel < userRequestingChannelDeletion.accessLevel || channelUnderContention.accessList.indexOf(socket.nickname) < 0)
  {
    socket.emit('errorHandler', 'restricted');
  }
  else {
    for(user in channelUnderContention.currentUsers)
    {
      // Handles removing user from previous channel
      var oldChannel = chatSession.users[user].currentChannel;
      //console.log(oldChannel);
      // Removes user from channel list for easier distribution of messages
      delete chatSession.channels[oldChannel].currentUsers[user];

      // Handles adding user to new channel's current users list
      chatSession.channels['main'].currentUsers[user] = true;

      // Changes user's current channel to the new one
      chatSession.users[user].currentChannel = 'main';

      //console.log(chatSession.channels[newChannelName].log);

      // Updates user's current chatlog to the correct one
      //io.to(chatSession.users[user].socket.id).emit('updateChatLog', chatSession.channels['main'].log);

      ChatLog.findOne({ channel: 'main' }, function (err, chatlog) {
        io.to(chatSession.users[user].socket.id).emit('updateChatLog', chatlog.log);
      });
    }

    // Ensures that everyone who was switched out of the current channel now has the correct channel list

    // Updates database to ensure that log is properly sanitizedMessage
    // Will update channel's chatlogs
    ChatLog.findOne({ channel: currentChannel }, function (err, chatlog) {
      // channel does not exist
      if(chatlog === null)
      {
        // Handles Creating chatlog for new channel
        var aChatLog = new ChatLog({
          channel: currentChannel,
          log: ''
        });

        aChatLog.save(function (err, aChatLog){
          if (err) return console.error(err);
        });
      }
      // channel actually exists
      else {
        chatlog.log = '';
        chatlog.save();
        //console.log(chatlog.log);
      }

    });



    // Actually deletes the channel from the list after all users have been transferred
    delete chatSession.channels[channelToDelete];
    // Updates all channel lists
    updateAllChannelLists();
    // Updates all selectors to ensure users are on the right channels
    io.to(socket.id).emit('updateSelector', channelName);
  }
});




// Handles When user has changed their nickname. Removes the old newNickName
// From the list of nicknames to ensure that user's nicknames are current
socket.on('nickChanged', function(oldNickName, newNickName){
  nicknames[nicknames.indexOf(oldNickName)] = newNickName;
  if(chatSession.users[newNickName].accessLevel == 0)
  {
    sysopName = newNickName;
  }
  delete   nicknames[oldNickName];
  updateNicknames();
});



// HANDLES UPDATING CHAT MESSAGES

/**
 * Handles user changing their channel with element
 */
socket.on('updateChatMessages', function(newChannel){
  // Find a way to
  chatSession.users[socket.nickname].currentChannel = newChannel;

  socket.emit('');

});




socket.on('userNameUpdate', function(){
  updateNicknames();
});




/**
 * Handles sending information to form
 */
socket.on('send message', function(data){
  try {

    // Handles both broadcast and private messages
    var split = data.split(" ");
    //console.log(data);
    // Handles broadcast made by sysop
    if(split[0] == '/broadcast')
    {
      // Checks to see if the user who just sent the message is the sysop
      if(chatSession.users[socket.nickname].accessLevel == 0)
      {
        broadcast(data, socket.nickname);
      }
      // Shoots off an error if the user is restricted
      else
      {
        io.to(socket.id).emit('errorHandler', 'restricted');
      }
    }
    // Will handle private messaging between users
    else if(split[0] == '/msg')
    {
      var otherUser = data.split(" ")[1].toLowerCase();
      // Will check to make sure that the user exists. If they don't, an error will shoot off.
      if(!(otherUser in chatSession.users))
      {
        io.to(socket.id).emit('errorHandler', 'userNotFound');
      }
      else
      {
        // Will force both users into a private channel
        privateMessage(data, otherUser, socket);
      }
    }
    else if(!commands.isCommand(data))
    {
      // Holds the channel in which the user sent the message
      var currentChannel = chatSession.users[socket.nickname].currentChannel;

      // Adds the current message to the log of the channel as it would be displayed by the user
      // This also takes care of making sure that the user send their chat message to the correct channel
      //chatSession.channels[currentChannel].log += '<b>' + socket.nickname + ': </b>' + data + '\n';

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


      // Holds current chat log for the current channel
      var currentLog = "";

      var query = {channel: currentChannel};

      // Will update channel's chatlogs
      ChatLog.findOne({ channel: currentChannel }, function (err, chatlog) {
        // channel does not exist
        if(chatlog === null)
        {
          // Handles Creating chatlog for new channel
          var aChatLog = new ChatLog({
            channel: currentChannel,
            log: ''
          });

          aChatLog.save(function (err, aChatLog){
            if (err) return console.error(err);
          });
        }
        // channel actually exists
        else {
          chatlog.log = chatlog.log + '<b>' + socket.nickname + ': </b>' + data + '\n';
          chatlog.save();
          //console.log(chatlog.log);
        }

      });






    }



    else {
      commands.run(chatSession.users[socket.nickname], data);
    }
    //TO BROADCAST socket.BROADCAST.emit('new message', data);
  } catch (e) {
    console.log(e);

  }

});




/**
 * Handles switching a user from one channel to another
 *
 * SECURITY CHECKS TO BE ADDED LATER
*/
socket.on('switchUsersChannel', function(user, newChannelName){
  // Handles removing user from previous channel
  var oldChannel = chatSession.users[user].currentChannel;
  // Removes user from channel list for easier distribution of messages
  delete chatSession.channels[oldChannel].currentUsers[user];
  // Handles adding user to new channel's current users list
  chatSession.channels[newChannelName].currentUsers[user] = true;
  // Changes user's current channel to the new one
  chatSession.users[user].currentChannel = newChannelName;
  // Updates user's current chatlog to the correct one
  // io.to(chatSession.users[user].socket.id).emit('updateChatLog', chatSession.channels[newChannelName].log);

  // Updates user's current chatlog to the correct one USING MONGODB!!
  ChatLog.findOne({ channel: newChannelName }, function (err, chatlog) {
    io.to(chatSession.users[user].socket.id).emit('updateChatLog', chatlog.log);
  });


});


/**
 * Handles switching a user from one channel to another
 *
 * SECURITY CHECKS TO BE ADDED LATER
*/
socket.on('userLeftChannel', function(){
  // Handles removing user from previous channel
  var oldChannel = chatSession.users[socket.nickname].currentChannel;
  // Removes user from channel list for easier distribution of messages
  delete chatSession.channels[oldChannel].currentUsers[socket.nickname];
  // Handles adding user to new channel's current users list
  chatSession.channels['main'].currentUsers[socket.nickname] = true;
  // Changes user's current channel to the new one
  chatSession.users[socket.nickname].currentChannel = 'main';
  // Updates user's current chatlog to the correct one
  //io.to(chatSession.users[socket.nickname].socket.id).emit('updateChatLog', chatSession.channels['main'].log);
  ChatLog.findOne({ channel: 'main' }, function (err, chatlog) {
    io.to(chatSession.users[user].socket.id).emit('updateChatLog', chatlog.log);
  });

});

/**
 * Handles what happens when a user disconnects from chat
 *
 */
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
