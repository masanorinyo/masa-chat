
/**
 * Module dependencies.
 */

module.exports=function(db){

	var express 	= require('express');
	var MongoStore 	= require('connect-mongo')(express);
	var app 		= express();
	var mongoose 	= require('mongoose');
	var passport 	= require('passport');
	var path 		= require('path');
	var username
	
	require('../config/passport')(passport); // pass passport for configuration

	// all environments
	app.set('port', process.env.PORT || 8080);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());

	app.use(express.cookieParser());
	app.use(express.session({
		secret	: 'crazy fire killing crazy monkey looking poop',
		key 	: 'express.sid',
		maxAge	: new Date(Date.now() + 3600000),
		store 	: new MongoStore({ mongoose_connection: db })
	}));

	app.use(passport.initialize());
	app.use(passport.session());
	
	app.use(express.methodOverride());
	app.use(function (req, res, next) {
		res.set('X-Powered-By', 'OAuth');
		next();
	});

	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
	app.use("/log", express.static(__dirname + '../../log'));
		
	
	
	
	


	// development only
	if ('development' == app.get('env')) {
	  	app.use(express.errorHandler());
	  	// grunt configuration
		var cp = require('child_process');
		var grunt = cp.spawn('grunt', ['--force', 'default', 'watch'])

		grunt.stdout.on('data', function(data) {
		    // relay output to console
		    console.log("%s", data)
		});
	}

	// routes 
	require('./routes/auth')(app, passport); // load our routes and pass in our app and fully configured passport
	require('./routes/chat_room')(app); // load our routes and pass in our app and fully configured passport


	return app;

};