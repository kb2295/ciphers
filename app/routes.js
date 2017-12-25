//routes.js is taken from an online tutorial


module.exports = function(app, passport) {


    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.hbs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.hbs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


        app.get('/login', function(req, res) {
            res.render('login.hbs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if error
            failureFlash : true // allow flash messages
        }));

       
        app.get('/signup', function(req, res) {
            res.render('signup.hbs', { message: req.flash('signupMessage') });
        });

        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if  error
            failureFlash : true // allow flash messages
        }));

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
