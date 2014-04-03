$(function(){
    
    //functions
    var getTime = function(){
         var date = new Date();
         return (
            date.getHours() < 10 ? '0' + date.getHours().toString() :
            date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' +
            date.getMinutes().toString() : date.getMinutes()
        );
     }


    var log_chat_message = function  (text,user,time, photoLink, type) {
        var chatbox = document.getElementById("chat_log");
        var userInfo = $('<div class="chatter"/>').text(user);
        var accessTime = $('<span class="accessTime"/>').text("- "+time);
        var arrow = $('<i class="fa fa-caret-up"/>');
        var message = $('<div class="message"/>').text(text);

        if(photoLink){
            var img      = $("<img class='img-circle'/>").attr('src',photoLink);
            userInfo.prepend(img);    
        }
        
        message.prepend(arrow);
        userInfo.append(accessTime);
        var li = $('<li />').append(userInfo,message);
        
       if (type ==='myself'){
            li.addClass('myMessage');

        } else if (type ==="others"){
            li.addClass("othersMessage");
        
        }
                
        $(li).hide().appendTo("#chat_log").fadeIn("fast");
        
        $(chatbox).stop().animate({
            scrollTop: chatbox.scrollHeight
        }, 500);
        
        //chatbox.scrollTop = chatbox.scrollHeight;
    };

     var log_system_message = function  (message,type) {
        var chatbox = document.getElementById("chat_log");
        var span = $('<span/>').text(message);
        var li  = $("<li class='systemMessage'/>").html(span);
        
        if (type === 'system') {
            li.addClass('emphasizeMessage');
        } else if (type === 'leave' || type === 'error') {
            li.addClass('warningMessage');
        }
             
        li.hide().appendTo("#chat_log").fadeIn('slow');
        // $('#chat_log').append(span).hide().fadeIn('fast');
        $(chatbox).stop().animate({
            scrollTop: chatbox.scrollHeight
        }, 500);
    };

    var socket = io.connect('http://masa-chat.nodejitsu.com');

    socket.on('entrance', function  (data) {
        $('#chatAudio')[0].play();
        log_system_message(data.message, 'normal');
    });

    socket.on('others_entrance', function  (data) {
        log_system_message(data.message, 'system');
    });

    socket.on('exit', function  (data) {
        log_system_message(data.message, 'leave');
    });

    socket.on('myChat', function  (data) {
        
        log_chat_message(data.message, data.chatter,getTime(),data.photoUrl,'myself');
    
    });

    socket.on('othersChat', function  (data) {

        log_chat_message(data.message, data.chatter,getTime(),data.photoUrl,'others');
    
    });

    socket.on('error', function  (data) {
        log_system_message(data.message, 'error');
    });

    socket.on('list_chatters',function(data){
        
        $("#chatters #numberBox").text(data.numOfChatters);
        $("#chatter-box").html('');

        for(var i=0;i < data.numOfChatters;i++){
            var icon = $('<div class="icon-wrapper"><i class="fa fa-circle"></i></div>');
            var li = $('<li class="online_chatter"/>');
            var div = $('<div class="chatter-wrapper"/>');

            div.text(data.chatters[i]);
            li.html(div);

            icon.prependTo(li);
            $("#chatter-box").append(li)
        }
    });



    $('#chat_box').keypress(function (event) {
        if (event.which == 13) {
            
            socket.emit('chat', {
                message: $('#chat_box').val()
            });
            
            $('#chat_box').val('');
        }
    });

    $('#submit_button').click(function (event) {
        socket.emit('chat', {

            message: $('#chat_box').val()
        });
        
        $('#chat_box').val('');
    });

});