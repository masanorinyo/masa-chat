var mongoose = require('mongoose');
var uuid = require('node-uuid');
var User = require('./user');

// Verification token model
var verificationTokenSchema = mongoose.Schema({
    _userId: {
    	type: String, 
    	required: true, 
    	ref: "User"
    },
    
    token: {
    	type: String, 
    	required: true
    },
    
    createdAt: {
    	type: Date, 
    	required: true, 
    	default: Date.now, 
    	expires: '4h'
    }
});



verificationTokenSchema.methods.createVerificationToken = function (done) {
    
    var verificationToken = this;
    var token = uuid.v4();
    
    verificationToken.set('token', token);
    
    verificationToken.save( function (err) {
        
        if (err){
        
        	return done(err);	
        
        }else{

        	return done(null, token);
        	console.log("Verification token", verificationToken);

        }
        
    });
};


module.exports = mongoose.model('VerificationToken', verificationTokenSchema);




