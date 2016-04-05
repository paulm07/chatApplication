/**
 * This file defines console command logic.
 * @Author = Francisco Ortega
 */
module.exports = function(io, session) {
var commands = {
	// Handles changing nick
	"nick": {
		numArgs: 1,
		handler: function(args, io, chatSession, user) {
			if(args[0].toLowerCase() in chatSession.users)
			{
				user.socket.emit('errorHandler', 'nickNameTaken');
			}
			// else if(args[0].toLowerCase() in reservedNickNames){
			// 	user.socket.emit('errorHandler', 'reservedNickNames');
			// }
			else {
				// Holds original nickname for deletion of old user's information
				var oldNickName = user.nickname;
				args[0] = args[0].toLowerCase();
				chatSession.users[args[0]] = {};
				// New username is initialized and filled with user's information

				//Update Channel in which User is In
				chatSession.channels[chatSession.users[oldNickName].currentChannel].currentUsers[args[0]] = true;
				delete chatSession.channels[chatSession.users[oldNickName].currentChannel].currentUsers[oldNickName];
				// Nickname inherited
				chatSession.users[args[0]].nickname = args[0];
				// Access Level inherited
				chatSession.users[args[0]].accessLevel = chatSession.users[oldNickName].accessLevel;
				// Socket inherited
				chatSession.users[args[0]].socket = chatSession.users[oldNickName].socket;
				// Socket nicknamed changed
				chatSession.users[args[0]].socket.nickname = args[0];
				// Current channel inherited
				chatSession.users[args[0]].currentChannel = chatSession.users[oldNickName].currentChannel;
				// Frees up nickname for any other user
				delete chatSession.users[oldNickName];
				// Sends message to user to notify server that nick has been succesfully changed
				//console.log(chatSession.users[args[0]]);
				user.socket.emit('notifyNickChange', oldNickName, args[0]);
			}
		}
	},
	"clear": {
		numArgs: 0,
		handler: function(args, io, session, user) {
			session.log = "";
			user.socket.emit('clear');
		}
	},
	"help": {
		numArgs: 0,
		handler: function(args, io, session, user) {
			user.socket.emit('message', '/nick <nickname> - change your username\n /clear - clear your chat log.');
		}
	},
	// Creates a New Channel
	"createChannel": {
		numArgs: 1,
		handler: function(args, io, session, user) {
			if(args[0].toLowerCase() in session.channels)
			{
				console.log("channel exists!");
				user.socket.emit('errorHandler', 'channelExists');
			}
			else {

				user.socket.emit('allowCreateRequest', args[0].toLowerCase());
			}
		}
	},
	// Used to delete a channel
	"removeChannel": {
		numArgs: 1,
		handler: function(args, io, session, user) {
			if(args[0].toLowerCase() in session.channels)
			{
				console.log("channel exists!");
				user.socket.emit('deletionRequest', args[0]);
			}
			else {
				user.socket.emit('errorHandler', 'invalidChannel');
			}
		}
	},
	// Used to delete a channel
	"leave": {
		numArgs: 1,
		handler: function(args, io, session, user) {
			if(args[0] == 'channel')
			{
				if(user.currentChannel == 'main')
				{
					user.socket.emit('errorHandler', 'defaultChannel');
				}
				else {
					user.socket.emit('request switch');
				}
			}
		}
	},
	// Sends user a list of channels
	"list": {
		numArgs: 1,
		handler: function(args, io, chatSession, user) {
			// console.log(args[0]);
			var updatedChannelList = {};
			console.log(args[0]); if(typeof args[0] == "undefined") // User has entered a
			{


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
								user.socket.emit('printChannelList', updatedChannelList);
		}
			else {
				for(line in chatSession.channels)
		  	{
		    	// Will only send channels which are public to the entire
		    	if(chatSession.channels[line].accessType == "public")
		    	{
		      	// Signifies that the channel list, indeed, exists and adds the instance
		      	// field to the object
		      	//updatedChannelList[line] = true;

		      	// Handles adding the appropriate hashtags to channels and checking if
						// channel substring matches
		      	if(chatSession.channels[line].accessLevel <= 1) { // CREATED BY ADMIN/MOD
							console.log(line);
							if(line.indexOf(args[0]) > -1)
							{
		        		updatedChannelList["##" + line] = true;
							}
		      	}
		      	else { // CREATED BY REGULAR USER
							if(line.indexOf(args[0]) > -1)
							{
								updatedChannelList["#" + line] = true;
							}
		      	}
		    	}
				}
			user.socket.emit('printChannelList', updatedChannelList);

		  // console.log(updatedChannelList);
		  //user.socket.emit('printChannelList', updatedChannelList);
		}
	}
	},

   // !!!!!!REMEMBER TO MAKE SPECIFIC TO THE USER WHEN SENDING ERROR MESSAGE!!!!! //
	"join": {
		numArgs: 2,
		handler: function(args, io, chatSession, user)
		{
			//console.log(user);
			if(args[0] != 'channel'){ // WILL SHOOT OFF ERROR IF USER DID NOT INCLUDE CHANNEL KEYWORD
			user.socket.emit('commandError');
		}
			else{

			if(args[1] in chatSession.channels){ // WILL ASSUME USER HAS CHOSE TO GO INTO PUBLIC CHANNEL AND WILL SWITCH THEM
				if(chatSession.channels[args[1]].accessType == "public"){
					//console.log("Send me channels!");
					io.to(chatSession.users[user.nickname].socket.id).emit('allowSwitchRequest', user.nickname, args[1]);
				}
				else { // WILL ASSUME USER HAS CHOSEN TO GO INTO A PRIVATE CHANNEL
					if(user.nickname in chatSession.channels[args[1]].accessList)
					{
						user.socket.emit('allowSwitchRequest', user.nickname, args[1].toLowerCase());
					}
					else {
						user.socket.emit('errorHandler', "forbiddenChannel");
					}
				}
			}
			else {
				user.socket.emit('errorHandler', 'invalidChannel');
			}
		}
	}
	},

  // Promotes user. Both SysOP and Admin can promote.
	"promote": {
		numArgs: 1,
		handler: function(args, io, chatSession, user) {
			// SysOP has request promotion
			if(args[0] in chatSession.users){
				console.log(chatSession.users[user.nickname].accessLevel);
				if(chatSession.users[user.nickname].accessLevel <= 1)
				{
					chatSession.users[args[0]].isModerator = true;
					if(chatSession.users[args[0]].accessLevel > 0){
					chatSession.users[args[0]].accessLevel = 1;
					}
					user.socket.emit('requestUserNameUpdate');
				}
				else {
					user.socket.emit('errorHandler', 'restricted');
				}
		}
		else {
			user.socket.emit('errorHandler', 'userNotFound');
		}
		}
	},

	// Demotes a moderator. Only sysOP can demote
	"demote": {
		numArgs: 1,
		handler: function(args, io, chatSession, user) {
			// SysOP has request promotion
			if(args[0] in chatSession.users){
				console.log(chatSession.users[user.nickname].accessLevel);
				if(chatSession.users[user.nickname].accessLevel == 0)
				{
					chatSession.users[args[0]].isModerator = false;
					chatSession.users[args[0]].accessLevel = 2;
					user.socket.emit('requestUserNameUpdate');
				}
				else {
					user.socket.emit('errorHandler', 'restricted');
				}
		}
		else {
			user.socket.emit('errorHandler', 'userNotFound');
		}
		}
	},

	"login": {
		numArgs: 2,
		handler: function(args, io, chatSession, user) {
			// SysOP has request promotion
			//console.log(user);
			if(args[0] != 'sysop'){ // WILL SHOOT OFF ERROR IF USER DID NOT INCLUDE CHANNEL KEYWORD
			user.socket.emit('commandError');
		}
			else{
				if(args[1] == 'illuminate')
				{
					// User which enters password is now sysop
					// Original user is now deleted and original user has now taken
					// control of sysop account.
					chatSession.users[user.nickname].accessLevel = 0;
					user.socket.emit('requestUserNameUpdate');
					//console.log(chatSession.users[user.nickname]);
				}
		}
	}
	},

}


var isCommand = function(msg) {
	return (msg.substring(0, 1) == "/");
}

/**
 * Runs a given command.
 * Parses a command into a name and a series of arg tokens.
 * @param  {Object}
 * @param  {String}
 */
var run = function(user, msg) {
	var cmd = msg.substring(1, msg.length);
	var args = cmd.match(/[A-z][A-z][A-z]*/g);
	var fun = args.shift();

	// Try catch in order to handle unknown/erroneous commands
 try{
	commands[fun].handler(args, io, session, user);
 }
	catch (err)
	{
		console.log(err);
		user.socket.emit('commandError');
	}

}

	return {
		run: run,
		isCommand: isCommand
	}
}
