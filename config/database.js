// config/database.js

var mongoose = require('mongoose');

mongoose.connect('mongodb://masanori:$Osaka1226@ds041387.mongolab.com:41387/masa-chat');

module.exports = mongoose.connection; 
