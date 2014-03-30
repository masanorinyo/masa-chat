module.exports = function(server,app){
	var chatter 	= require('../app/lib/chatter');
	var chat_room	= require('socket.io').listen(server);

	chatter.set_sockets(chat_room.sockets);

	chat_room
		.on('connection', function (socket) {
			// socket io event handler

			var room = null;
			if(app.locals.chatroom){
				room = app.locals.chatroom;
			}
			socket.join(room);
			
			var chatter_name = "Anonymous-"+socket.id.substring(0,3);
			var userPhoto = '';

			//if the user has a username
			if(app.locals.username){
				chatter_name = 	app.locals.username;
			}

			socket.set('username',chatter_name);


			console.log(app.locals.userPhoto);

			//if the user has a username
			if(app.locals.userPhoto){
				userPhoto = app.locals.userPhoto;
			}

			console.log(app.locals.userPhoto);

			socket.set('photoUrl',userPhoto);
			
			//reset the global variable
			app.locals.username ='';
			app.locals.userPhoto = '';


			if(room){
			  	chatter.connect_chatter({
			    	socket 	: socket,
			    	room 	: room
			  	});
		  	}
		});
}