var everyone  = null;

var get_chatters_name = function(config){
  var chatters  = [];
  for(var i = 0;i<everyone.clients(config.room).length;i++){
    everyone.clients(config.room)[i].get('username',function(err,name){
      chatters.push(name);
    });
  }

  return chatters;
}

var count_chatters = function(config){
  
  return everyone.clients(config.room).length;

}


exports.set_sockets = function(sockets){
  
  everyone = sockets;

}; 

exports.connect_chatter = function  (config) {
  var numOfChatters    = null;

  var username  = '';
   var photoUrl  = '';
  
  //get a name for each socket
  config.socket.get('username',function(err,name){
      username = name;
  });
  
   config.socket.get('photoUrl',function(err,photo){
      photoUrl = photo;
  });
  //this will update the chatter's list
  everyone.in(config.room).emit('list_chatters',{
    chatters        :get_chatters_name(config),
    numOfChatters   :count_chatters(config)
  });

  //when a user enter the room, 
  //this message will be shown to the user
  config.socket.emit('entrance', {message: '< Welcome to the chat room! >'});
  
  //when a user enter the room, 
  //this message will be shown to everyone except for the user.
  config.socket.broadcast.to(config.room).emit('others_entrance', {message: username + ' is online.'});

  //when a user enter the room, 
  //this message will be shown to everyone except for the user.
  config.socket.on('disconnect', function  () {
    config.socket.broadcast.to(config.room).emit('exit', {
      message: username + ' has disconnected.',
      username:username
    });
    
    config.socket.leave(config.room); 

    everyone.in(config.room).emit('list_chatters',{
      chatters        :get_chatters_name(config),
      numOfChatters   :count_chatters(config)
    });

   
  });

  //when a user sends a message
  //it will be shown to everyone.
  config.socket.on('chat', function  (data) {
    config.socket.broadcast.to(config.room).emit('othersChat', {
      message: data.message,
      chatter: username,
      message  : data.message,
      chatter  : username,
      photoUrl : photoUrl
    });

    config.socket.emit('myChat', {
      message: data.message,
      chatter: username,
      message  : data.message,
      chatter  : username,
      photoUrl : photoUrl
    });

  });
};

exports.failure = function  (socket) {
  socket.emit('error', {message: 'Please log in to the chatroom.'});
};
