var nodemailer = require('nodemailer');
var verificationTokenModel = require('../models/verificationToken');
var Mail = function () {
	
	var smtpTransport = nodemailer.createTransport("SMTP",{
		service:"Gmail",
		auth:{
			user:"masanorinyo@gmail.com",
			pass:"$Osaka1226"
		}
	});
	
	this.fill = function(info){
		this.mailOptions = {
			from	: "Masanori <masanorinyo@gmail.com>",
			to 		: info.receiver,
			subject	: info.subject,
			text 	: info.textContent,
			html 	: info.htmlContent
		}	
	}

	this.send = function () {
		smtpTransport.sendMail(this.mailOptions,function(error,response){
		
			if(error){
			
				console.log(error);
			
			}else{

				console.log("Message sent: "+response.message);
			
			}
		});	
	};

};

module.exports = function(info) {
	var instance = new Mail();
	console.log(info);
	instance.fill(info);
	instance.send();
	return instance;
};

