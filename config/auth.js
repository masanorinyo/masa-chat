// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

	'facebookAuth' : {
		'clientID' 				: '478782022226141',
		'clientSecret' 			: '651a0ae61790b700ad643873e1781ad5',
		'callbackURL' 			: 'http://masa-chat.nodejitsu.com/auth/facebook/callback',
		'connectCallbackURL' 	: 'http://masa-chat.nodejitsu.com/connect/facebook/callback'
	},

	'twitterAuth' : {
		'consumerKey' 			: 'Nb3QUO3hjbWbtmIZHaYDvrbo6',
		'consumerSecret' 		: 'KK47AQIDZGrK7bULZxmvjQmuil04YU2bInuX82qUxwXiqohChm',
		'callbackURL' 			: 'http://masa-chat.nodejitsu.com/auth/twitter/callback',
		'connectCallbackURL' 	: 'http://masa-chat.nodejitsu.com/connect/twitter/callback'
	},

	'googleAuth' : {
		'clientID' 				: '896183225652-amhe3lcc0mcuf85ckhj9m3o344tjebcr.apps.googleusercontent.com',
		'clientSecret' 			: 'KulJIX-iGnMkfLHx_kjuiaxZ',
		'callbackURL' 			: 'http://masa-chat.nodejitsu.com/auth/google/callback'
	},

	'googleConnectAuth' : {
		'clientID' 				: '896183225652-j5ev94u31s5fnq12flocqlpdm66f8tbt.apps.googleusercontent.com',
		'clientSecret' 			: 'vIZEeG1GIXgwkeJ-FxlfWbx8',
		'connectCallbackURL' 	: 'http://masa-chat.nodejitsu.com/connect/google/callback'		
	}


};