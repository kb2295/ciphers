// db.js
var mongoose = require('mongoose') 

// define the data in our collection
const Message = new mongoose.Schema({ //_id
	encrypted: String,
	plaintext: String,
	key: String,
	algorithm: String
});

//User.findOne({name:name}, function()..{
	//let messages = user.messages;
	// res.render('message', {messages:messages});
// });

// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var User = mongoose.Schema({

    local            : {
        email        : String,
        password     : String, 
        messages	 : [Message]
    }

});

// generating a hash
User.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
User.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
mongoose.model('User', User);
mongoose.model('Message', Message);
let dbconf;
if (process.env.NODE_ENV === 'PRODUCTION') {
 // if we're in PRODUCTION mode, then read the configration from a file
 // use blocking file io to do this...
 const fs = require('fs');
 const path = require('path');
 const fn = path.join(__dirname, 'config.json');
 const data = fs.readFileSync(fn);

 // our configuration file will be in json, so parse it and set the
 // conenction string appropriately!
 const conf = JSON.parse(data);
 dbconf = conf.dbconf;
} else {
 // if we're not in PRODUCTION mode, then use
 dbconf = 'mongodb://localhost/kb2295';
}

mongoose.connect(dbconf);
