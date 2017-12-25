var mongoose = require("mongoose");
require('./db');
var Message = mongoose.model('Message');
var User = mongoose.model('User');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const hbs = require('hbs');
//================================================//
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var session      = require('express-session');

// var configDB = require('./config/database.js');

// mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));


// required for passport
app.use(session({
    secret: 'ilovescotchscotchyscotchscotch', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

require('./app/routes.js')(app, passport); 

//================================================//
app.use(express.static(require('path').resolve(__dirname, "public")));
app.set('view engine', 'hbs');


app.get('/location', function(req, res){
	res.render('location.hbs')
});


app.get('/ceasershift', function(req, res) {
	console.log("inside get ceaser", req.user)
	if(!(req.user == undefined)){
		User.find({_id: req.user._id}, function(err, result, count) {
			var messagesMapped = result[0].local.messages.map(function(elem) {
			    elem.key = "shift by: " + (elem.key);
			    return elem
			}); 
			var filteredMessages = messagesMapped.filter(function(elem, index, array) {
		        return elem.algorithm == "Caesar";
		    });
			res.render('ceaser.hbs', {result: filteredMessages});
		});
	}
	else{
		res.render('ceaser.hbs', {error: "Please Log in to view"});
	}
	
});
app.get('/ceasershift/add', function(req, res) {
  res.render('ceaserAdd');
});

app.post('/ceasershift/add', function(req, res) {
	
	let encryptedM = escape(req.body.encrypted)
	let dKey = escape(req.body.decryptKey)
	let eKey = escape(req.body.encryptKey)
	let decryptedM = escape(req.body.plaintext)
	console.log("encryptedM", encryptedM, "dKey", dKey, "eKey", eKey, "decryptedM", decryptedM)

	//encryption, no Key
	if(eKey == ""){
		console.log("No key, redirecting")
		res.redirect('/location')

	}
	else{
		
		//encryption
		if (!(req.body.plaintext==undefined)){
			console.log("we have plaintext")
			encryptedM = ceaserAlgo(req.body.plaintext, parseInt(eKey))
			console.log("encryptedM", encryptedM)

		}
		//decryption
		if(!(req.body.encrypted==undefined)){
			console.log("we have encryptedtext!")
			decryptKey = (-1*dKey)
			decryptedM = ceaserAlgo(req.body.encrypted, (parseInt(dKey)*-1))
			console.log(decryptedM)
		
		}
		
		var newMessage = new Message({
			encrypted: encryptedM,
			plaintext: decryptedM,
			key: req.body.decryptKey || req.body.encryptKey ,
			algorithm: "Caesar"
		});
		if(!(req.user==undefined)){
			User.findOne({_id: req.user._id}, function (err, doc){
			// console.log("FOUND: ", doc)
			doc.local.messages.push(newMessage);
			doc.save();
			});
			newMessage.save(function(err, message, count){
				res.redirect('/ceasershift');
			});
		}
		else{
			res.redirect('/login');
		}
	}
	
});

app.get('/vigenere', function(req, res) {
	if(!(req.user == undefined)){
		User.find({_id: req.user._id}, function(err, result, count) {
			var filteredMessages = result[0].local.messages.filter(function(elem, index, array) {
		        return elem.algorithm == "Vigenere";
		    }
		);

			res.render('vigenere.hbs', {result: filteredMessages});
		});
	}
	else{
		res.render('vigenere.hbs', {error: "Please Log in to view"});
	}
});
app.get('/vigenere/add', function(req, res) {
  res.render('vigenereAdd');
});

app.post('/vigenere/add', function(req, res) {
	console.log("req.body.plaintext", req.body.plaintext)
	console.log("req.body.encrypted", req.body.encrypted)
	console.log("req.body.decryptKey", req.body.decryptKey)
	console.log("req.body.encryptKey", req.body.encryptKey)
	let dKey = undefined
	let eKey = undefined
	if(!(req.body.decryptKey==undefined)){
		dKey = escape(req.body.decryptKey);
	}
	if(!(req.body.encryptKey==undefined)){
		eKey = escape(req.body.encryptKey);
	}
	let decryptedM = undefined
	let encryptedM = undefined

	if (!(req.body.plaintext==undefined)){
		decryptedM = escape(req.body.plaintext)
		encryptedM = vigenereCipher.encrypt(req.body.plaintext, eKey)

	}
	if(!(req.body.encrypted==undefined)){
		encryptedM = escape(req.body.encrypted)
		console.log("we have encryptedtext!")
		decryptedM = vigenereCipher.decrypt(req.body.encrypted, dKey)
		
	}
	
	var newMessage = new Message({
		encrypted: encryptedM,
		plaintext: decryptedM,
		key: dKey || eKey,
		algorithm: "Vigenere"
	})

	if(!(req.user==undefined)){
		User.findOne({_id: req.user._id}, function (err, doc){
		// console.log("FOUND: ", doc)
		doc.local.messages.push(newMessage);
		doc.save();
		});
	
		newMessage.save(function(err, message, count){
			res.redirect('/vigenere');
		});
	}
	else{
		res.redirect('/login');
	}
});

//Taken from an online source
var ceaserAlgo = function(str, amount) {
	console.log(str, amount)
	// Wrap the amount
	if (amount < 0){
		return ceaserAlgo(str, amount + 26);
	}

	// Make an output variable
	var output = '';

	// Go through each character
	for (var i = 0; i < str.length; i ++) {

		// Get the character we'll be appending
		var c = str[i];

		// If it's a letter...
		if (c.match(/[a-z]/i)) {
			console.log("letter");
			// Get its code
			var code = str.charCodeAt(i);
			console.log("code", code)
			console.log("amount", amount);
			console.log("(code - 97 + amount)", (code - 97 + amount))
			console.log("(code - 97 + amount) % 26)", ((code - 97 + amount) % 26));
			console.log("(code - 97 + amount) % 26) + 97", ((code - 97 + amount) % 26) + 97);
			console.log("shifted code", ((code - 97 + amount) % 26) + 97)
			let sh = String.fromCharCode(((code - 97 + amount) % 26) + 97);
			console.log(sh)

			// Uppercase letters
			if ((code >= 65) && (code <= 90)){
				c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
			}

			// Lowercase letters
			else if ((code >= 97) && (code <= 122)){
				c = String.fromCharCode(((code - 97 + amount) % 26) + 97);
			}

		}

		// Append
		output += c;

	}

	// All done!
	console.log("output", output);
	return output;

};

//Taken from an online source
var vigenereCipher = {

  _tabulaRecta: {
    a: "abcdefghijklmnopqrstuvwxyz",
    b: "bcdefghijklmnopqrstuvwxyza",
    c: "cdefghijklmnopqrstuvwxyzab",
    d: "defghijklmnopqrstuvwxyzabc",
    e: "efghijklmnopqrstuvwxyzabcd",
    f: "fghijklmnopqrstuvwxyzabcde",
    g: "ghijklmnopqrstuvwxyzabcdef",
    h: "hijklmnopqrstuvwxyzabcdefg",
    i: "ijklmnopqrstuvwxyzabcdefgh",
    j: "jklmnopqrstuvwxyzabcdefghi",
    k: "klmnopqrstuvwxyzabcdefghij",
    l: "lmnopqrstuvwxyzabcdefghijk",
    m: "mnopqrstuvwxyzabcdefghijkl",
    n: "nopqrstuvwxyzabcdefghijklm",
    o: "opqrstuvwxyzabcdefghijklmn",
    p: "pqrstuvwxyzabcdefghijklmno",
    q: "qrstuvwxyzabcdefghijklmnop",
    r: "rstuvwxyzabcdefghijklmnopq",
    s: "stuvwxyzabcdefghijklmnopqr",
    t: "tuvwxyzabcdefghijklmnopqrs",
    u: "uvwxyzabcdefghijklmnopqrst",
    v: "vwxyzabcdefghijklmnopqrstu",
    w: "wxyzabcdefghijklmnopqrstuv",
    x: "xyzabcdefghijklmnopqrstuvw",
    y: "yzabcdefghijklmnopqrstuvwx",
    z: "zabcdefghijklmnopqrstuvwxy"
  },

  encrypt: function(plainText, keyword){
    if( typeof(plainText) !== "string" ){
      return "invalid plainText. Must be string, not " + typeof(plainText);
    }
    if( typeof(keyword) !== "string" ){
      return "invalid keyword. Must be string, not " + typeof(keyword);
    }

    plainText = plainText.toLowerCase();
    keyword = keyword.match(/[a-z]/gi).join("").toLowerCase();
    var encryptedText = "";
    var specialCharacterCount = 0;

    for( var i = 0; i < plainText.length; i++ ){
      var keyLetter = (i - specialCharacterCount) % keyword.length;
      var keywordIndex = vigenereCipher._tabulaRecta.a.indexOf(keyword[keyLetter]);

      if( vigenereCipher._tabulaRecta[plainText[i]] ){
        encryptedText += vigenereCipher._tabulaRecta[plainText[i]][keywordIndex];
      }else{
        encryptedText += plainText[i];
        specialCharacterCount++;
      }
    }

    return encryptedText;
  },

  decrypt: function(encryptedText, keyword){
    if( typeof(encryptedText) !== "string" ){
      return "invalid encryptedText. Must be string, not " + typeof(encryptedText);
    }
    if( typeof(keyword) !== "string" ){
      return "invalid keyword. Must be string, not " + typeof(keyword);
    }

    encryptedText = encryptedText.toLowerCase();
    keyword = keyword.match(/[a-z]/gi).join("").toLowerCase();
    var decryptedText = "";
    var specialCharacterCount = 0;

    for( var i = 0; i < encryptedText.length; i++ ){
      var keyLetter = (i - specialCharacterCount) % keyword.length;
      var keyRow = vigenereCipher._tabulaRecta[keyword[keyLetter]];

      if( keyRow.indexOf(encryptedText[i]) !== -1 ){
        decryptedText += vigenereCipher._tabulaRecta.a[keyRow.indexOf(encryptedText[i])];
      }else{
        decryptedText += encryptedText[i];
        specialCharacterCount++;
      }
    }
    console.log("decryptedText", decryptedText)
    return decryptedText;
  }

};

app.listen(process.env.PORT || 3000);