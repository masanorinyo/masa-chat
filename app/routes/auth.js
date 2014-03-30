//--load user model--//
var User       		= require('../models/user');
var fs 				= require('fs');
var verification 	= require('../lib/verification');
var auth_utility	= require("../lib/auth-utility");
var fbgraph 		= require("fbgraph");
var Twit 			= require('twit');
// ********************** Module export **********************//
module.exports = function(app, passport) {

	//======== Normal routes ========//
	//Home page
	app.get('/', function(req, res) {
		
		req.app.locals.chatroom=null;

		if(!req.session.errorMessage){
			req.session.errorMessage="";
		}

		
		if(req.user){
			
			res.redirect('/room/'+req.user.profile.username+"/me");

		}else{

			res.render('contents/index.jade',{
				message: req.session.errorMessage
			},auth_utility.cleanup(req,res));	

		}

		
	});

	// post a message on different social networks
	app.get("/post/:platform",function(req,res){

		var platform = req.params.platform;
		var wallPost = {
  			
  			message : req.query.message +"\n"+ req.query.url

		};

		
		if(platform === "facebook"){

			var fb_token = req.user.facebook.token;
			fbgraph.setAccessToken(fb_token);

			fbgraph.post(req.user.facebook.id+"/feed",wallPost,function(err,res){
				console.log(res);
			});



		}else if(platform === "twitter"){
			
			var T = new Twit({
				consumer_key		: "Nb3QUO3hjbWbtmIZHaYDvrbo6",
			 	consumer_secret 	: "KK47AQIDZGrK7bULZxmvjQmuil04YU2bInuX82qUxwXiqohChm",
			 	access_token 		: req.user.twitter.token,
			 	access_token_secret : req.user.twitter.tokenSecret
			});

			console.log(req.user.twitter.token+" secret:"+req.user.twitter.tokenSecret);

			T.post('statuses/update', { 

				status: wallPost.message

			}, function(err, reply) {

				console.log(reply);
			
			});


		}else if(platform === "all"){
			var fb_token = req.user.facebook.token;
			fbgraph.setAccessToken(fb_token);

			fbgraph.post(req.user.facebook.id+"/feed",wallPost,function(err,res){
				console.log(res);
			});

			var T = new Twit({
				consumer_key		: "Nb3QUO3hjbWbtmIZHaYDvrbo6",
			 	consumer_secret 	: "KK47AQIDZGrK7bULZxmvjQmuil04YU2bInuX82qUxwXiqohChm",
			 	access_token 		: req.user.twitter.token,
			 	access_token_secret : req.user.twitter.tokenSecret
			});

			console.log(req.user.twitter.token+" secret:"+req.user.twitter.tokenSecret);

			T.post('statuses/update', { 

				status: wallPost.message

			}, function(err, reply) {

				console.log(reply);
			
			});

		}

	});

	//Setting
	app.get('/setting', auth_utility.isLoggedIn, function(req, res) {
		
		
		//check if the user has an email address
		if(!req.user.profile.hasEmail){
			req.logout();
			req.session.cookie.expires = false;	
		}

		if(req.user){
			
			//this will get the account's name if it is the only connected account.
			//if there are multiple accounts connected, the variable will be 'undefined'
			//if this variable is defined as one account, the described account will not show the unlink button.
			var onlyOneConnectedAccount = auth_utility.checkAccountStatus(req.user);
			
			
			res.render('auth/setting.jade', {
				user 			: req.user,
				account 		: onlyOneConnectedAccount,
				userPhoto		: req.user.profile.primaryPhoto,
				username		: req.user.profile.username,
				isLoggedIn		: req.user,
				myname			: req.user.profile.username,
				isVerified		: req.user.profile.confirmed,
				onSettingPage 	: true
			});

		}else{
			res.redirect('/');
		}
	});

	app.post('/defaultPhoto/:type',function(req,res){

		var type = req.params.type;
		console.log(req.user.id);

		User.findOne({
			
			'_id':req.user.id

		},function(err,user){
			if(err){
				
				throw err;
			
			}else if(user){

				if(type =='facebook'){
					
					user.profile.primaryPhoto = req.user.profile.photos.facebook;
					user.save();
					res.send(user.profile.primaryPhoto);

				}else if(type == "twitter"){
					
					user.profile.primaryPhoto = req.user.profile.photos.twitter;
					user.save();
					res.send(user.profile.primaryPhoto);

				}else if(type =="google"){
					
					user.profile.primaryPhoto = req.user.profile.photos.google;
					user.save();
					res.send(user.profile.primaryPhoto);			

				}else if(type =="local"){
					
					user.profile.primaryPhoto = req.user.profile.photos.local;
					user.save();
					res.send(user.profile.primaryPhoto);

				}
			}
		})

		

	});

	app.post('/upload',function(req,res){
		
		fs.readFile(req.files.localPhoto.path, function (err, data) {
		  
			if(err){
				res.send(403);
			}else{

				if (req.files.localPhoto.type != 'image/png' && req.files.localPhoto.type != 'image/jpeg' && req.files.localPhoto.type != 'image/gif' ){
			
					res.send(403);
				
				}else {
					
					var newPath = __dirname +"/../public/images/"+req.user.profile.username+".jpg";
					fs.writeFile(newPath, data, function (err) {
						if(err){
							
							throw err;
					    
						}else{
							
							req.user.profile.photos.local = req.protocol + "://" + req.get('host') + "/images/"+req.user.profile.username+".jpg";
					    	
					    	req.user.save();
					    	res.redirect("back");	
					    }
					    
					});
				}
			}
		});
	});

	//resend a verification code
	app.get('/resend',function(req,res){
		
		if(!req.session.errorMessage){
			req.session.errorMessage = '';
		}

		if(req.user){
		
			verification.sendVerification(req,req.user,req.user.profile.email);
			res.redirect('/setting');
		
		}else{

			req.session.errorMessage = 'Please log into your account';
			res.redirect('/');
		}
	});


	// check if the input password is correct
	app.get("/checkPass",function(req,res){
		
		var isCorrect = false;
		
		User.findOne({
			'local.email':req.user.local.email
		},function(err,user){
			if(err){

				res.send(isCorrect);		

			}else if(user){

				var validPass = user.validPassword(req.query.oldPass);
				
				if(validPass){
					isCorrect = true;	
				}
				
				res.send(isCorrect);		
			
			}else{

				res.send(isCorrect);		
			}
		});
	});

	//Logout
	app.get('/logout', function(req, res) {
		
		//log user's logout activity
		auth_utility.writeLog(req.user.profile.username,req.user.id,'Logged off');
		req.logout();
		req.session.cookie.expires = false;
		res.redirect('/');
	});

	//Delete Account
	app.get('/delete',function(req,res){
		
		if(req.user){
			User.remove(function (err, user) {
		  	
			  	req.session.destroy(function() {
					
					req.logout();

				});

			  	if (err){
			  	
			  		throw err;
		  		
		  		}else{
		  			
		  			//log user's deleting activity
					auth_utility.writeLog(req.user.profile.username,req.user.id,'Deleted');	  			
		  			
		  			User.findById(req.user.id,function(err,user){
		  				res.redirect('/');
		  			})			
		  		}
			});
		}else{
			res.redirect('/');
		}
	});
	
	//======== Verification Email ========//
	
	//when users click the link provided in the account verification email
	app.get("/verify/:token", function (req, res, next) {
		var token = req.params.token;
		
		//if the token provided in the link matches 
		//the user's affiliated token in the database
		verification.verifyUser(token,'verify', function(err,user) {
			
			if (err){
			
				res.redirect("/");
			
			}else if(!user){

				res.redirect("/");

			}else{
				
				//log user's verifying account activity
				auth_utility.writeLog(user.profile.username,user.id,'Verified account');
				
				res.redirect('/room/'+req.user.profile.username+"/me");	
			} 
			
		});
	});

	//======== Reset Password ========//
	app.get("/reset", function (req, res, next) {
		
		//Define the error message in session if it is undefined.
		if(!req.session.errorMessage){
			req.session.errorMessage = '';
		}

		//the error message in session gets emptified after rendering
		res.render('auth/resetPass.jade',{
			errorMessage:req.session.errorMessage
		}, auth_utility.cleanup(req,res));

	});

	// when users submit their emails to get a password reset email.
	app.post("/reset/verifyEmail", function (req, res, next) {

		User.findOne({
		
			'local.email':req.body.email
		
		},function(err,user){
			
			if(err){

				return done(err);
			
			//if user is not found with that Email, add an error message into the session
			}else if(!user){

				req.session.errorMessage = "There is no user registered with that Email";
				res.redirect('/reset');

			//if user is found with that Email, send a Email.
			}else{


				//log the time of reset email sent out
				auth_utility.writeLog(user.profile.username,user.id,'asked for password reset');
				verification.sendResetVerification(req, user, user.local.email);
				res.redirect('/login');
			}

		});


	});

	// users get E-mail with the link, which contains the token
	app.get("/reset/:token", function (req, res, next) {
		var token = req.params.token;
		
		//check if the token provided in the E-mail matches the user's affiliated token in the database
		verification.verifyUser(token,'reset', function(err,user) {
			if (err){
				
				res.redirect("/");
			
			}else if(!user){

				res.redirect("/");

			}else{

				//if the tokens match, then renders 'newPass jade' with
				//the user's email loaded
				res.render('auth/newPass.jade',{

					acctEmail:user.local.email
				
				});	
			
			} 
		});
	});

	//when users submit their new password on the "newPass.jade"
	app.post("/reset/verified/:type", function(req,res,next){
        var type = req.params.type;
        //first find the user in the database with the submitted E-mail
        User.findOne({

        	'local.email':req.body.email

	        },function(err,user){

	        	if(err){

					console.log(err);
					res.redirect('/');

				}else{

					//if the user is found, then set a new password for his or her account
					var newUser		= new User();
					var newPassword = newUser.generateHash(req.body.password);
					user.local.password = newPassword;
					
					user.save(function(err,user){

						if(err){
							
							throw err;
						
						}else{

							if(type==='resetPass'){

								//log user's reset password activity
								auth_utility.writeLog(user.profile.username,user.id,'Reset password');
								next();

							}else if(type==='changePass'){

								//log user's reset password activity
								auth_utility.writeLog(user.profile.username,user.id,'Changed password');
								res.redirect('/setting');
							}else{

								res.redirect('/setting');

							}
						}
					})
				}
			}

		//once the user successfully set a new password,
		// authenticate with passportJS
		)},	passport.authenticate('local-login',{

				failureRedirect :'/login',

		//if the user is authenticated, stores the user's id in cookies
		//so that the user won't need to retype the password in the future.
		}), function(req,res,next){
				
				auth_utility.rememberMe(req,res);
				res.redirect('/room/'+req.user.profile.username+"/me");	
		
		}
	);
	



	//======== Authentication ========//
	//local login
	app.get('/login', function(req, res) {
		
		if(!req.session.loginMessage){
			req.session.loginMessage = '';
		}

		
		if(req.user){
		
			res.redirect('/room/'+req.user.profile.username+"/me");
		
		}else{
			//clean up empties the login session message.
			res.render('auth/login.jade', { 
				message: req.session.loginMessage,
			},auth_utility.cleanup(req,res));
		}
	});

	// login authentication
	app.post('/login', passport.authenticate('local-login', {
		
		failureRedirect : '/login' // redirect back to the signup page if there is an error
	
	}),function(req,res){
		
		auth_utility.rememberMe(req,res);
		res.redirect('/room/'+req.user.profile.username+"/me");	
	
	});

	

	// Local signup
	app.get('/signup', function(req, res) {
		
		if(!req.session.signupMessage){
			req.session.signupMessage = '';
		}

		if(req.user){
		
			res.redirect('/room/'+req.user.profile.username+"/me");
		
		}else{
		
			//clean up empties the signup session message
			res.render('auth/signup.jade', { 
				message: req.session.signupMessage 
			},auth_utility.cleanup(req,res));
		
		}
	});

	

	// Signup authentication
	app.post('/signup', passport.authenticate('local-signup', {
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
	}),function(req,res,next){
				
		auth_utility.rememberMe(req,res,next);
		res.redirect('/room/'+req.user.profile.username+"/me");	
	
	});


	//Facebook
	app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email','read_stream','publish_actions']}));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			failureRedirect : '/'
		}),function(req,res){
			
			auth_utility.rememberOauth(req,res);
			res.redirect('/room/'+req.user.profile.username+"/me");
		
		});


	//Twitter
	app.get('/auth/twitter', passport.authenticate('twitter', { scope : ['email','photo'] }));

	// handle the callback after twitter has authenticated the user
	app.get('/auth/twitter/callback',
		passport.authenticate('twitter', {
			
			failureRedirect : '/'
		
		}),function(req,res){
			
			auth_utility.rememberOauth(req,res);
			

			//check if users have an email address
			if(!req.user.profile.hasEmail){

				res.redirect('/getEmail');	

			}else{
				

				res.redirect('/room/'+req.user.profile.username+"/me");	

			}
		}
	);

	app.get('/getEmail', function(req,res){
	
		if(!req.session.errorMessage){
			req.session.errorMessage = '';
		}

		res.render('auth/getEmail.jade',{
			errorMessage:req.session.errorMessage
		}, auth_utility.cleanup(req,res));
	
	});

	app.post('/getEmail/complete', function(req,res){
		
		User.findById(req.user.id,function(err,user){
			if(err){
			
				console.log(err);

				req.session.destroy(function() {
					
					req.logout();
					res.redirect('/');
				});
				
			}else{

				User.findOne({

					'profile.email':req.body.email

				},function(err,existingUser){
					if(err){
					
						throw err;
						res.redirect('/');
					
					}else if(existingUser){

						req.session.errorMessage = 'That Email is already used';
						res.redirect('/getEmail');

					}else{

						user.profile.email = req.body.email;
						user.profile.hasEmail   = true; 		
						user.save(function(err,user){
							
							if(err){
								
								throw err;
								res.redirect('/');
							
							}else{
								
								//log user's signup activity
                                auth_utility.writeLog(user.profile.username,user.id,'Twitter signup');
								
								verification.sendVerification(req,user,user.profile.email);
								res.redirect('/room/'+req.user.profile.username+"/me");
							
							}
						});
					}
				}); 
			}
		});
	});

	//Google
	app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

	// the callback after google has authenticated the user
	app.get('/auth/google/callback',
		passport.authenticate('google', {
			failureRedirect : '/'
		}),function(req,res){

			auth_utility.rememberOauth(req,res);	
			res.redirect('/room/'+req.user.profile.username+"/me");
		});


	//======== Authorization ========//
	// Local authorization
	app.get('/connect/local', function(req, res) {

		if(!req.session.signupMessage){
			req.session.signupMessage = '';
		}

		if(!req.user || req.user.local.email){

			res.redirect('/setting');

		}else{
		
			res.render('auth/connect-local.jade', { 
				message: req.session.signupMessage 
			}, auth_utility.cleanup(req,res));
		}

	});

	app.post('/connect/local/submitted', passport.authenticate('local-signup', {
		
		successRedirect : '/setting', // redirect to the secure setting section
		failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
	
	}));

	// facebook authorization

	// send to facebook to do the authentication
	app.get('/connect/facebook', function(req,res){
		
		if(!req.user){
			res.redirect('/');
		}

	}, passport.authenticate('facebook-connect', { scope : 'email' }));

	// handle the callback after facebook has authorized the user
	app.get('/connect/facebook/callback',function(req,res){
		
		if(!req.user){
			res.redirect('/');
		}

	},passport.authenticate('facebook-connect', {
	
		successRedirect : '/setting',
		failureRedirect : '/'
	
	}));

	// twitter authorization

	// send to twitter to do the authentication
	app.get('/connect/twitter', function(req,res){
		
		if(!req.user){
			res.redirect('/');
		}

	}, passport.authenticate('twitter-connect', { scope : 'email' }));

	// handle the callback after twitter has authorized the user
	app.get('/connect/twitter/callback',function(req,res){
		
		if(!req.user){
			res.redirect('/');
		}

	}, passport.authenticate('twitter-connect', {
		
		successRedirect : '/setting',
		failureRedirect : '/'
	
	}));


	// google authorization

	// send to google to do the authentication
	app.get('/connect/google', function(req,res){
		
		if(!req.user){
			res.redirect('/');
		}

	}, passport.authenticate('google-connect', { scope : ['profile', 'email'] }));

	// the callback after google has authorized the user
	app.get('/connect/google/callback',function(req,res){
		
		if(!req.user){
			res.redirect('/');
		}

	}, passport.authenticate('google-connect', {
		successRedirect : '/setting',
		failureRedirect : '/'
	}));


	//======== Unlink ========//
	// used to unlink accounts. for social accounts, just remove the token
	// for local account, remove email and password
	// user account will stay active in case they want to reconnect in the future

	// local unlink
	app.get('/unlink/local', function(req, res) {
		
		var user            = req.user;

		if(!user){
			res.redirect('/');
		}

		//log user's unlinking activity
        auth_utility.writeLog(user.profile.username,user.id,'Local unlinked');

		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {

			
			res.redirect('/setting');
		});

	
		
	});

	// facebook unlink
	app.get('/unlink/facebook', function(req, res) {
		var user            = req.user;

		if(!user){
			res.redirect('/');
		}

		//log user's unlinking activity
        auth_utility.writeLog(user.profile.username,user.id,'facebook unlinked');

		user.facebook.token = undefined;
		
		user.save(function(err) {
			res.redirect('/setting');
		});

		
	});

	// twitter unlink
	app.get('/unlink/twitter', function(req, res) {
		var user           = req.user;

		if(!user){
			res.redirect('/');
		}

		//log user's unlinking activity
        auth_utility.writeLog(user.profile.username,user.id,'Twitter unlinked');
		
		user.twitter.token = undefined;

		user.save(function(err) {
			res.redirect('/setting');
		});

		
	});

	// google unlink
	app.get('/unlink/google', function(req, res) {
		var user          = req.user;


		if(!user){
			res.redirect('/');
		}
		
		//log user's unlinking activity
        auth_utility.writeLog(user.profile.username,user.id,'Google unlinked');

		user.google.token = undefined;
		
		user.save(function(err) {
			res.redirect('/setting');
		});

		
	});



};


