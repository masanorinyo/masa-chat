var User       				= require('../models/user');
var verification 			= require('../lib/verification');
var auth_utility 			= require('../lib/auth-utility')
var verificationTokenModel  = require('../models/verificationToken');




module.exports = function(app){
	

	app.get('/visitor/:roomName/:key',function(req,res){
		var roomName 	= req.params.roomName;
		var key 		= req.params.key;
		if(req.user){
			res.redirect('/room/'+roomName+"/"+key);

		}else{
			res.render('components/getName.jade',{
				roomName 	: roomName,
			 	key 		: key
			});
		}

	});

	app.post('/visitor/:roomName/:key',function(req,res){
		
		//this route will set the user's name
		//and redirect the user to the chatroom
		
		var visitor = {
			chatroom 	: req.params.roomName,
			key 		: req.params.key,
			username 	: req.body.username
		}

		//stores in the global variable 
		//this will help socket set it's username
		req.app.locals.username = visitor.username;


		res.redirect('/room/'+visitor.chatroom+'/'+visitor.key);
	
	});

	//Chat room
	app.get('/room',auth_utility.isLoggedIn,function(req,res){

		res.redirect('/room/'+req.user.profile.username+'/me');

	});

	//Chat room
	app.get('/room/:username',auth_utility.isLoggedIn,function(req,res){

		res.redirect('/room/'+req.user.profile.username+'/me');

	});
	
	app.get('/room/:username/:key',function(req,res){
		
		var key = req.params.key;
		
		var user = {
			roomName 		: req.params.username,
			isMyRoom 		: false,
			facebookLinked	: false, 
			twitterLinked	: false,	
			googleLinked	: false, 
			userPhoto		: false,	
			myname 			: false,
			url 			: false,
			num 			: 0
		}

		var renderPage = function(key,user,req,res){
			res.render('contents/room.jade',{
				
				myname				: user.myName,
				userPhoto			: user.userPhoto,
				roomName			: req.params.username,
				message 			: req.session.errorMessage,
				isLoggedIn			: req.user,
				isMyRoom			: user.isMyRoom,
				facebookLinked		: user.facebookLinked,
				twitterLinked 		: user.twitterLinked,
				googleLinked		: user.googleLinked,
				key 				: key,
				url 				: user.url,
				numOfLinkedAccounts	: user.num

			}, auth_utility.cleanup(req,res));
		}

		//reset the global variable
		req.app.locals.userPhoto=''

		//passing the variables to the app page 
		req.app.locals.chatroom = user.roomName;

		//define the error message in the session
		if(!req.session.errorMessage){
			req.session.errorMessage="";
		}		
		
		if(key==="me"){
			//if users are logged in
			if(req.user){

				user.userPhoto 			 = req.user.profile.primaryPhoto;
				user.myName 	  		 = req.user.profile.username;
				user.facebookLinked 	 = req.user.facebook.token;
				user.twitterLinked 		 = req.user.twitter.token;
				user.googleLinked 		 = req.user.google.token;
				req.app.locals.username  = user.myName;
				req.app.locals.userPhoto = user.userPhoto;

				
				if(user.facebookLinked){
					user.num++;
				}

				if(user.twitterLinked){
					user.num++;
					
				}

				if(user.googleLinked){
					user.num++;
					
				}
				
				// in case user sings up with twitter and 
				// directly jump to "room" page
				// users will be redirect to home page without their emails registered
				if(!req.user.profile.hasEmail){
					req.session.errorMessage="Please register your Email";
					req.logout();
					req.session.cookie.expires = false;
				}

				// if the chatroom is the user's room
				if(req.user.profile.username === user.roomName){
					user.isMyRoom = true;

					//make a token and get a url
					//Once users get the token, render the page.
					verification.getToken(req,user,function(user){

						renderPage(key,user,req,res);
						
					});

				}else{
					
					res.redirect('/room/'+user.myName+"/me");					
				
				}

			//if the user is NOT invited to the chatroom.
			}else{

				req.session.errorMessage = "This is not your chat room";
				res.redirect('/');
				
			}




		}else{

			if(req.user && req.params.username == req.user.profile.username){
				req.app.locals.photo 	= req.user.profile.primaryPhoto;
				res.redirect('/room/'+req.user.profile.username+'/me');
			
			}else{
				verification.verifyUser(key,'visitor', function(err,user) {
					if (err){
						
						req.session.errorMessage = "There was an error in verifying your key to the chatroom";
						res.redirect("/");
					
					}else if(!user){

						req.session.errorMessage = "You are not invited to the chat room";
						res.redirect("/");

					}else{
						
						if(req.user){
							user.userPhoto 			 = req.user.profile.primaryPhoto;
							user.myName 	  		 = req.user.profile.username;
							req.app.locals.username  = user.myName;
							req.app.locals.userPhoto = req.user.profile.primaryPhoto;
						}

						renderPage(key, user,req,res);
						
					} 
				});
			}
		}
	});
}