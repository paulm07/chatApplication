/**
 * Chat Session Data is stored here.
 */
module.exports = {
	// Holds each individual user
	users: [],
	// Holds user count
	count: 0,
	// Holds the logs for each individual channel
	// This list is loaded with the first three main items.
	channel: {},
	// Holds channel access list
	channelAccessList: []
	// Holds list of administrators


	 //Depercated. Channels list will hold key of channel name and log of each individual channel
	//log: "",
	 //Deprecated. Player nicks will be handled directly by server
	//playerNicks: {}


}
