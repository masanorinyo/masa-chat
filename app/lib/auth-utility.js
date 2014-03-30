var fs 				= require('fs');

exports.writeLog = function(user,id,activity){
	
	//create a file with appending function
	var logFile = fs.createWriteStream('./log/userActivities.txt', {
	  	flags: "a",
	  	encoding: "encoding",
	  	mode: 0744
	});

	logFile.write('User: '+user+" - id: "+id+' - '+ 'Activity: '+activity+' - '+'When: '+new Date() + "\n");

}

//check on the connection status of other accounts
//if all the other accounts are not connected, this will return "false"
exports.checkAccountStatus = function(user){
	
	//when the connection status of account is true,
	//then that account will be pushed into acct array.
	var acct =[];
	var status = {
		'local'		:false,
		'facebook'	:false,
		'twitter'	:false,
		'google'	:false
	};


	//check the connection status of each account
	if(user.local.email){ status.local = true; }
		
	if(user.facebook.token){ status.facebook = true; }
			
	if(user.twitter.token){ status.twitter = true; }
			
	if(user.google.token){ status.google = true; }

	var i = 0;
	
	//check how many accounts are connected.
	for(var key in status){
		
		//if the status is true, then push the account into the acct array
		//this will show which accounts are connected
		if(status[key]){
			i++;
			acct.push(key);
		}
	}


	if(i==1){
		
		//if the number of connected accounts is only one, 
		//return the connected account		
		console.log("There is only "+acct[0]+" connected");
		return acct[0];
	
	}else{
		
		//if there are multiple accounts connected, then return false
		console.log("There are multiple accounts connected");
		return false;
	
	}
}
	
//remember me function for oAuthentication
exports.rememberOauth = function(req,res){
	req.session.cookie.maxAge = 1000*60*3;
}

//remember me function for local login and signup
exports.rememberMe = function(req,res){
 	if (req.body.remember_me) {
      	req.session.cookie.maxAge = 1000 * 60 * 3;
	}else{
      	req.session.cookie.expires = false;
    }
}

// route middleware to ensure user is logged in
exports.isLoggedIn = function(req, res, next) {
	if (req.isAuthenticated()){
				
		return next();
	
	}else{

		res.redirect('/');
	
	}
}

exports.isInvited = function(req,res){
	var isInvited = false;
	
	return isInvited=false;

	
}

// clean up the session after error shows up
exports.cleanup = function (req,res){

	req.session.signupMessage = '';
	req.session.loginMessage = '';
	req.session.errorMessage = '';
}

