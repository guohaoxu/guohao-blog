var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    flash = require('connect-flash'),
    compression = require('compression'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),

    routes = require('./routes/index'),
    settings = require('./settings'),
    User = require('./models/user')

    fs = require('fs'),
    accessLog = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a', encoding: 'utf8'}),
    errorLog = fs.createWriteStream(path.join(__dirname, 'error.log'), {flags: 'a', encoding: 'utf8'}),

    crypto = require('crypto'),

    app = express(),

    User = require('./models/user.js'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    GithubStrategy = require('passport-github').Strategy;

app.set('port', process.env.PORT || 3001);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(compression())
app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: settings.cookieSecret,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30
    },
    resave: false,
    saveUninitialized: true
}));

app.use(logger('dev'));
app.use(logger({stream: accessLog}));

app.use(express.static(path.join(__dirname, './public'), {
  maxAge: 1000 * 60 * 60 * 24 * 30 * 12
}));
app.use(express.static(path.join(__dirname, './uploads')));

passport.use('local', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  function (username, password, done) {
    User.findByUsername(username, function(err, user) {
      var md5 = crypto.createHash('md5'),
        thePassword = md5.update(password).digest('hex');
      if (err) {return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password != thePassword) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
passport.use(new GithubStrategy({
  clientID: '945b550396ae11844a1a',
  clientSecret: 'f093613f65901568ef4767a11ce769235a11037d',
  callbackURL: 'http://localhost:3001/auth/github/callback'
}, function (accessToken, refreshToken, profile, cb) {
  console.log('profile: ', profile)
  User.findOrCreate({
    username: profile.username
  }, {
    githubId: profile.id,
    displayName: profile.displayName,
    email: profile.emails[0].value,
    tx: profile.photos[0].value,
    accessToken: accessToken
  }, function (err, user) {
    return cb(err, user);
  });
}))
passport.serializeUser(function (user, done) {//保存user对象
  // done(null, user.username);
  done(null, user);//可以通过数据库方式操作
});

passport.deserializeUser(function (user, done) {//删除user对象
  // User.get(username, function (err, user) {
  //   done(err, user);
  // });
  done(null, user);//可以通过数据库方式操作
});

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/',
    failureFlash: true
  }),
  function (req, res) {
    console.log('req.user: ', req.user)
    req.session.user = req.user
    res.redirect('/')
  }
);

app.all('/userssss', isLoggedIn);
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
}
app.get('/logoutttt', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/auth/github', passport.authenticate('github', {scope: 'email'}));
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login'}),
  function (req, res) {
    req.session.user =  req.user
    res.redirect('/u/' + req.user.username)
  }
)


routes(app);
app.get('/accessLog', function (req, res, next) {
  var data = fs.readFileSync('access.log', 'utf-8');
  res.end(data)
})
app.get('/errorLog', function (req, res, next) {
  var data = fs.readFileSync('error.log', 'utf-8');
  res.end(data)
})

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    res.render('404');
    next(err);
});

app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + '] ' + req.url + '\n';
  errorLog.write(meta + err.stack + '\n');
  next();
})

app.listen(app.get('port'), function() {
    console.log('Server listening on ', app.get('port'));
});

//20160316
