var mail                    = require('./mail');
var verificationTokenModel  = require('../models/verificationToken');
var User                    = require('../models/user');

var createVerification = function(req,user,email){
    var verificationToken = new verificationTokenModel({_userId: user._id});
    
    
    this.send = function(info,type){
        verificationToken.createVerificationToken(function (err, token) {
            if (err){ 
                
                return console.log("Couldn't create verification token", err);
            
            }else{
                
                info.textContent += req.protocol + "://" + req.get('host') + "/"+type+"/" + token;
                info.htmlContent += req.protocol + "://" + req.get('host') + "/"+type+"/"+ token;

                mail(info, function (error, success) {
                    if (error) {
                    
                        console.error("Unable to send via nodeMail: " + error.message);
                        return;
                    
                    }else{
                        console.info("Sent an Email");
                    }
                    
                });
            }
        });
    }
};

exports.getToken = function(req,user,callback){
    var verificationToken = new verificationTokenModel({ _userId: req.user._id });
    verificationToken.createVerificationToken(function (err, token) {
        if (err){ 
            
            return callback(user);
        
        }else{

            var username = user.roomName;
            user.url = req.protocol + "://" + req.get('host') + "/visitor/"+username+"/"+ token;
            

            return callback(user);

        }
    });
}


exports.sendVerification = function(req,user,email){
    var instance = new createVerification(req,user,email);;
    

    var info = {
        receiver: email,
        subject:"Confirmation Email - simple chatting room",
        textContent:"Please click the following link to verify your account",
        htmlContent:"<p style='font-size:15px;'>Please click the following link to verify your account</p></br>"
    };

    instance.send(info,'verify');

}    

exports.sendResetVerification = function(req,user,email){
    var instance = new createVerification(req,user,email);;
    

    var info = {
        receiver: email,
        subject:"Forgot password - simple chatting room",
        textContent:"Please click the following link to reset your password",
        htmlContent:"<p style='font-size:15px;'>Please click the following link to reset your password</p></br>"
    };

    instance.send(info,'reset');
};


exports.verifyUser = function(token,type,done) {
    verificationTokenModel.findOne({
    
        token: token
    
    }, function (err, doc){
        if (err){
            
            return done(err);   
        
        }else if(!doc){

            return done(err); 

        }else{
            
            User.findOne({ _id: doc._userId }, function (err, user) {
                if (err){ 
                    
                    return done(err);
                
                // if user is not found
                }else if(!user){

                    return done(err);

                // if user is found
                }else{
                    
                    //if this module was called from
                    if(type=='verify'){
                        user.profile.confirmed = true;    
                        user.save(function(err){
                        
                            if(err){
                            
                                return done(err);
                            
                            }else{
                                
                                console.log('The user has been verified');
                                return done(null,user);
                            }
                        }); 
                    }else{
                        return done(null,user);
                    }
                    
                    
                }
                
            })  
        } 
        
    })
};
