// config/database.js

var mongoose = require('mongoose');

mongoose.connect('mongodb://masanori:$Osaka1226@ds037097.mongolab.com:37097/simple_chatting_room');

module.exports = mongoose.connection; 
