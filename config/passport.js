//--load dependencies--//
var LocalStrategy       = require('passport-local').Strategy;
var FacebookStrategy    = require('passport-facebook').Strategy;
var TwitterStrategy     = require('passport-twitter').Strategy;
var GoogleStrategy      = require('passport-google-oauth').OAuth2Strategy;
var fs                  = require("fs");

//--email verification--//
var verification        = require('../app/lib/verification');

//--load user model--//
var User                = require('../app/models/user');

//--load oAuthentication configuration--//
var configAuth          = require('./auth'); // use this one for testing


//--functions--//
//make user's name unique by concatenating a number to the name
//once the name becomes unique, callback function
function uniqify_name(name,num,callback){
    User.findOne({

        'profile.username':name

    },function(err,user){
        
        if(err){
        
            throw err;
        
        }else if(user){
            
            stringNum = num.toString();
            name = name.concat(stringNum);
            num++;
            uniqify_name(name,num,callback);

        }else{
            callback(name)
        }
    }); 
}


//-- log file --//
//create a file with appending function
var logFile = fs.createWriteStream('./log/userActivities.txt', {
    flags: "a",
    encoding: "encoding",
    mode: 0744
});

var writeLog = function(user,id,activity){
    
    logFile.write('User: '+user+" - id: "+id+' - '+ 'Activity: '+activity+' - '+'When: '+new Date() + "\n");

}

module.exports = function(passport) {

    //--serialize users for persistent login sessions--//
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    //--deserialize users out of session--//
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    //========================== Local Login ==========================//
    passport.use('local-login', new LocalStrategy({
        
        //Overwrites the default usernameField with email
        usernameField : 'email',
        passwordField : 'password',
        //This will allow in checking if a user is logged in
        //(passes user data in the req from the router)
        passReqToCallback : true

    },
    function(req, email, password, done) {
        
        //clears out the session message
        req.session.loginMessage = '';
    
        process.nextTick(function() {
            User.findOne({ 'local.email' :  email }, function(err, user) {
                
                // if there are any errors, return the error
                if(err){
                    
                    return done(err);
                
                }else if (!user){
                 
                    req.session.loginMessage='No user found';
                    return done(null, false, req.session.loginMessage);
                
                }else if(!user.validPassword(password)){
                
                    req.session.loginMessage='Wrong password';
                    return done(null, false, req.session.loginMessage);
                
                }else{

                    //log user's logging activity
                    writeLog(user.profile.username,user.id,'Local Login');
                    return done(null, user);
                
                }
            });
        });

    }));

    //========================== Local Signup ==========================//
    passport.use('local-signup', new LocalStrategy({
        //Overwrites the default usernameField with email
        usernameField : 'email',
        passwordField : 'password',
        //This will allow in checking if a user is logged in
        //(passes user data in the req from the router)
        passReqToCallback : true 
    },
    function(req, email, password, done) {
        
        //clears out the session message
        req.session.signupMessage ='';

        process.nextTick(function() {
            
            
            // check if the user is already logged in
            if (!req.user) {
                
                User.findOne({ 

                    'local.email' :  email 
                
                }, function(err, user) {
                
                    if(err){
                    
                        return done(err);
                    
                    }else if(user){
                        
                        req.session.signupMessage ='That Email is already taken';
                        return done(null, false, req.session.signupMessage);
                    
                    }else{

                        // create a new user if there are no error and 
                        // a user already using the Email in the process
                        
                        //get a name from Email
                        var nameMatch = email.match(/^([^@]*)@/);
                        var name = nameMatch ? nameMatch[1] : null;
                        
                        //if name is successfully extracted from email
                        if(name){

                            //check if there is any user already using the name
                            //if any user with the same name, concatenate with a number
                            //untill the name becomes unique
                            //once the name becomes unique, then the user information will be saved with the callback function.
                            uniqify_name(name,1,function(name){
                                var newUser            = new User();

                                // Stores email and hashed password into a new user variable.
                                newUser.profile.email           = email;
                                newUser.local.email             = email;
                                newUser.profile.primaryPhoto    = '/images/default_img.png';
                                newUser.profile.photos.local    = '/images/default_img.png';
                                newUser.local.password          = newUser.generateHash(password);
                                //once users verify the account by clicking the link provided 
                                //in the verification Email, this will become true
                                newUser.profile.confirmed       = false; 
                                
                                //when users sign up with their twitter account
                                //they need to submit their email separately
                                newUser.profile.hasEmail        = true; 
                                newUser.profile.username        =name;
                                newUser.save(function(err,user){
                                    if (err){
                                    
                                        return done(err);
                                    
                                    }else{
                                    
                                        //log user's signup activity
                                        writeLog(user.profile.username,user.id,'Local signup');
                                            
                                        verification.sendVerification(req, newUser,email)
                                        
                                        
                                        return done(null, newUser);
                                    
                                    }
                                });
                            });
                            
                        }else{
                            return done(null);
                        }
                        
                    }
                });
            
            //when the user is already logged in, 
            //he or she can link the local account
            } else {

                var user            = req.user;
                
                //check to see if there is already a user registered with that Email
                User.findOne({

                    'local.email':email

                },function(err,existingUser){

                    if(err){

                        return done(err);

                    //if there is a user registered with that Email, 
                    //error message will be stored in the errorMessage variable in the session.
                    }else if(existingUser){

                        req.session.signupMessage='That Email is already used';
                        return done(err);

                    }else{

                        user.local.email            = email;
                        user.local.password         = user.generateHash(password);
                        user.profile.photos.local   = '/images/default_img.png';
                        user.save(function(err) {
                            
                            if (err){
                             
                                return done(err);
                            
                            }else{
                             
                                //log user's authorizatoin activity
                                writeLog(user.profile.username,user.id,'Local Authorizatoin');
                                return done(null, user,req.session.signupMessage);
                            
                            }
                        });
                    }

                });

                

            }
        });

    }));


    //========================== Facebook ==========================//
    //*********** Signup & Login ***********//
    passport.use('facebook',new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        
        //This will allow in checking if a user is logged in
        //(passes user data in the req from the router)
        passReqToCallback : true


    },
    function(req, token, refreshToken, profile, done) {

        process.nextTick(function() {
            
            var picture = profile.username;
            var picUrl  = "https://graph.facebook.com/"+picture+"/picture";

            // when the user is not logged in
            if (!req.user) {

                User.findOne({ 
                
                    'facebook.id' : profile.id 

                }, function(err, user) {
                    
                    if (err){
                     
                        return done(err);

                    }else if(user){

                        // if there is a user id already but no token 
                        // (user was linked at one point and then removed)
                        if (!user.facebook.token) {
                        
                            user.facebook.token             = token;
                            user.profile.photos.facebook    = picUrl;
                            user.profile.gender             = profile.gender;
                            

                            user.save(function(err){
                                if (err){
                                    
                                    return done(err);
                                
                                }else{
                                    
                                    //log user's reconnection activity
                                    writeLog(user.profile.username,user.id,'Facebook reconnect');
                                    return done(null, user);    
                                
                                }
                            });
                        }else{

                            //log user's logging activity
                            writeLog(user.profile.username,user.id,'Facebook Login');
                            // the user is found
                            return done(null, user); 
                        
                        }

                        
                    
                    } else {

                        // if there is no user with facebook account
                        // create a new user
                        var newUser                     = new User();

                        newUser.facebook.id             = profile.id;
                        newUser.facebook.token          = token;
                        newUser.profile.username        = profile.name.givenName+"-"+profile.name.familyName;
                        newUser.profile.email           = profile.emails[0].value;
                        newUser.profile.primaryPhoto    = picUrl;
                        newUser.profile.photos.facebook = picUrl;
                        newUser.profile.gender          = profile.gender;
                        
                        //once users verify the account by clicking the link provided 
                        //in the verification Email, this will become true
                        newUser.profile.confirmed       = false;
                        
                        //when users sign up with their twitter account
                        //they need to submit their email separately
                        newUser.profile.hasEmail        = true; 

                        newUser.save(function(err,user) {
                            if (err){
                            
                                return done(err);
                            
                            }else{

                                //log user's signup activity
                                writeLog(user.profile.username,user.id,'Facebook signup');
                                verification.sendVerification(req, newUser,newUser.profile.email);
                                return done(null, newUser);
                            
                            }
                        });
                    }
                });

            } else {
                
                return done(null);
               
            }
        });
    }));

    //*********** Authorization / Account Connect ***********//
    passport.use('facebook-connect',new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.connectCallbackURL,
        
        //This will allow in checking if a user is logged in
        //(passes user data in the req from the router)
        passReqToCallback : true


    },function(req, token, refreshToken, profile, done){
        
        process.nextTick(function() {
        
            var picture = profile.username;
            var picUrl  = "https://graph.facebook.com/"+picture+"/picture";

            // (user was linked at one point and then removed)
            
            if (!req.user.facebook.token) {
            
                var user                        = req.user;
                user.facebook.id                = profile.id;
                user.facebook.token             = token;
                user.profile.photos.facebook    = picUrl;
                user.profile.gender             = profile.gender;
                

                user.save(function(err){
                    if (err){
                        
                        throw err;
                    
                    }else{
                        
                        //log user's reconnection activity
                        writeLog(user.profile.username,user.id,'Facebook reconnect');
                        return done(null, user);    
                    
                    }
                });
            }else{

                // There is already a user logged in
                // This allows for linking Facebook account
                // gets the user out of the session
                
                var user                        = req.user; 

                user.facebook.id                = profile.id;
                user.facebook.token             = token;
                user.profile.photos.facebook    = picUrl;
                user.profile.gender             = profile.gender;

                user.save(function(err) {
                    if (err){
                        
                        return done(err);
                    
                    }else{

                        //log user's authorizatoin activity
                        writeLog(user.profile.username,user.id,'Facebook Authorizatoin');
                        return done(null, user);
                
                    }
                });
            }
        })
    }));


    //========================== Twitter Login ==========================//
    //*********** Signup & Login ***********//
    passport.use('twitter',new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        
        //This will allow in checking if a user is logged in
        //(passes user data in the req from the router)
        passReqToCallback : true 

    },
    function(req, token, tokenSecret, profile, done){

        process.nextTick(function() {
            
            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 
                
                    'twitter.id' : profile.id 
                
                }, function(err, user){
                    
                    if (err){
                        
                        return done(err);
                
                    }else if(user){
                        
                        console.log("twitter user : found");
                        // if there is a user id already but no token 
                        // (user was linked at one point and then removed)
                        if (!user.twitter.token) {
                        

                            console.log("twitter user : No token");
                            user.twitter.token          = token;
                            user.twitter.tokenSecret    = tokenSecret;
                            user.profile.photos.twitter = profile.photos[0].value;
                            

                            user.save(function(err) {
                       
                                if (err){
                                
                                    return done(err);
                                
                                }else{
                                
                                    //log user's reconnection activity
                                    writeLog(user.profile.username,user.id,'Twitter reconnect');
                                    return done(null, user);    
                                
                                }
                            });
                        
                        }else{
                         
                            console.log("twitter user : id and token found");
                            //log user's logging activity
                            writeLog(user.profile.username,user.id,'Twitter Login');
                            return done(null, user); // user found, return that user    
                        
                        }
                        
                    } else {
                        
                        console.log("twitter user : Nothing was found");
                        // if there is no user, create them
                        var newUser                     = new User();

                        //sends confirmation email
                        

                        newUser.twitter.id              = profile.id;
                        newUser.twitter.token           = token;
                        newUser.twitter.tokenSecret     = tokenSecret;
                        newUser.profile.username        = profile.displayName.replace(/\s/g, '-');
                        newUser.profile.primaryPhoto    = profile.photos[0].value;
                        newUser.profile.photos.twitter  = profile.photos[0].value;
                        
                        
                        //When users submit the reset password form,
                        //this will become true.
                        newUser.profile.confirmed       = false;
                        
                        //when users sign up with their twitter account
                        //they need to submit their email separately
                        newUser.profile.hasEmail        = false; 

                        newUser.save(function(err) {
                            if (err){

                                return done(err);

                            }else{

                                return done(null, newUser);

                            }
                        });
                    }
                });

            } else {
                
                console.log("twitter user : already loggedin");
                // There is already a user logged in
                // This allows for linking twitter account
                // gets the user out of the session
                var user                    = req.user; 

                user.twitter.id             = profile.id;
                user.twitter.token          = token;
                user.twitter.tokenSecret    = tokenSecret;
                user.profile.photos.twitter = profile.photos[0].value;
                

                user.save(function(err) {
                    if (err){

                        return done(err);

                    }else{
                        
                        //log user's authorizatoin activity
                        writeLog(user.profile.username,user.id,'Twitter Authorizatoin');
                        return done(null, user);

                    }
                });
            }
        });
    }));

    //*********** Authorization ***********//
     passport.use('twitter-connect',new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.connectCallbackURL,
        
        //This will allow in checking if a user is logged in
        //(passes user data in the req from the router)
        passReqToCallback : true 

    },
    function(req, token, tokenSecret, profile, done){

        process.nextTick(function() {
            
           var user = req.user;
                        
            
            // (user was linked at one point and then removed)
            if (!user.twitter.token) {
            
                user.twitter.id             = profile.id;
                user.twitter.token          = token;
                user.twitter.tokenSecret    = tokenSecret;
                user.profile.photos.twitter = profile.photos[0].value;
                

                user.save(function(err) {
           
                    if (err){
                    
                        return done(err);
                    
                    }else{
                    
                        //log user's reconnection activity
                        writeLog(user.profile.username,user.id,'Twitter reconnect');
                        return done(null, user);    
                    
                    }
                });
            
            }else{
             
                 
                // There is already a user logged in
                // This allows for linking twitter account
                // gets the user out of the session
                var user                    = req.user; 

                user.twitter.id             = profile.id;
                user.twitter.token          = token;
                user.twitter.tokenSecret    = tokenSecret;
                user.profile.photos.twitter = profile.photos[0].value;
                

                user.save(function(err) {
                    if (err){

                        return done(err);

                    }else{
                        
                        //log user's authorizatoin activity
                        writeLog(user.profile.username,user.id,'Twitter Authorizatoin');
                        return done(null, user);

                    }
                });
            }
        });
    }));

    //========================== Google+ Login ==========================//
    //*********** Signup & Login ***********//
    passport.use('google',new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        
        //This will allow in checking if a user is logged in
        //(passes user data in the req from the router)
        passReqToCallback : true 

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {
            
            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 
                
                    'google.id' : profile.id 
                
                }, function(err, user) {
                    if (err){

                        return done(err);

                    }else if(user){

                        // if there is a user id already but no token 
                        // (user was linked at one point and then removed)
                        if (!user.google.token) {
                           
                            user.google.token           = token;
                            user.google.name            = profile.displayName.replace(/\s/g, '-');
                            user.profile.gender         = profile._json.gender;
                            user.profile.photos.google  = profile._json.picture;



                            user.save(function(err) {
                                if (err){

                                    return done(err); 

                                }else{

                                    //log user's reconnection activity
                                    writeLog(user.profile.username,user.id,'Google reconnect');
                                    return done(null, user);

                                }
                            });
                        }else{

                            //log user's logging activity
                            writeLog(user.profile.username,user.id,'Google login');
                            return done(null, user);    
                        
                        }

                    } else {
                        
                        // if there is no user, create them
                        var newUser                 = new User();

                        //sends confirmation email
                        

                        newUser.google.id               = profile.id;
                        newUser.google.token            = token;
                        newUser.profile.username        = profile.displayName.replace(/\s/g, '-');
                        newUser.profile.email           = profile.emails[0].value; // pull the first email
                        newUser.profile.primaryPhoto    = profile._json.picture;
                        newUser.profile.photos.google   = profile._json.picture;
                        newUser.profile.gender          = profile._json.gender;
                        
                        //When users submit the reset password form,
                        //this will become true.
                        newUser.profile.confirmed   = false;
                        
                        //when users sign up with their twitter account
                        //they need to submit their email separately
                        newUser.profile.hasEmail    = true; 
                        
                        
                        newUser.save(function(err,user) {
                            if (err){

                                return done(err);

                            }else{

                                //log user's signup activity
                                writeLog(user.profile.username,user.id,'Google signup');
                                verification.sendVerification(req, newUser,newUser.profile.email);
                                return done(null, newUser);

                            }
                        });
                    }
                });

            } else {
                
                // There is already a user logged in
                // This allows for linking google account
                // gets the user out of the session
                var user                    = req.user;

                user.google.id              = profile.id;
                user.google.token           = token;
                user.profile.photos.google  = profile._json.picture; 
                user.profile.gender         = profile._json.gender;
                

                user.save(function(err) {
                    if (err){

                        return done(err);

                    }else{

                        //log user's authorizatoin activity
                        writeLog(user.profile.username,user.id,'Google Authorizatoin');
                        return done(null, user);

                    }
                });
            }
        });
    }));

    //*********** Authorization ***********//
    passport.use('google-connect',new GoogleStrategy({

        clientID        : configAuth.googleConnectAuth.clientID,
        clientSecret    : configAuth.googleConnectAuth.clientSecret,
        callbackURL     : configAuth.googleConnectAuth.connectCallbackURL,
        
        //This will allow in checking if a user is logged in
        //(passes user data in the req from the router)
        passReqToCallback : true 

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {
            
            var user = req.user;
            
            // (user was linked at one point and then removed)

            if (!user.google.token) {
               
                user.google.id              = profile.id;
                user.google.token           = token;
                user.google.name            = profile.displayName.replace(/\s/g, '-');
                user.profile.gender         = profile._json.gender;
                user.profile.photos.google  = profile._json.picture;



                user.save(function(err) {
                    if (err){

                        return done(err); 

                    }else{

                        //log user's reconnection activity
                        writeLog(user.profile.username,user.id,'Google reconnect');
                        return done(null, user);

                    }
                });
            }else{

                // There is already a user logged in
                // This allows for linking google account
                // gets the user out of the session

                user.google.id              = profile.id;
                user.google.token           = token;
                user.profile.photos.google  = profile._json.picture; 
                user.profile.gender         = profile._json.gender;
                
                console.log(profile.id);

                user.save(function(err) {
                    if (err){

                        return done(err);

                    }else{

                        //log user's authorizatoin activity
                        writeLog(user.profile.username,user.id,'Google Authorizatoin');
                        return done(null, user);

                    }
                });
            
            }

                    
        });
    }));     

};
