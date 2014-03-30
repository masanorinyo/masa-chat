#!/usr/bin/env node

// server config
var http		= require('http');
var argv		= require('optimist').argv;
var repl		= require('repl');
var db 			= require('./database');
var app			= require('../app/app')(db);
var server 		= http.createServer(app);
var ioConfig	= require('./io-config')(server,app);
var prompt 		= repl.start({ prompt:'auth>'});
 

server.listen(app.get('port'),function(){
	console.log('Express server listening on port '+app.get('port'));
});

