var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    flash = require('connect-flash'),

    favicon = require('serve-favicon'),
    logger = require('morgan'),

    routes = require('./routes/index'),
    settings = require('./settings'),
    User = require('./models/user')

    fs = require('fs'),
    accessLog = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a', encoding: 'utf8'}),
    errorLog = fs.createWriteStream(path.join(__dirname, 'error.log'), {flags: 'a', encoding: 'utf8'}),

    app = express(),

    User = require('./models/user.js'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    GithubStrategy = require('passport-github').Strategy;

app.set('port', process.env.PORT || 3001);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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



app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, './uploads')));

passport.use('local', new LocalStrategy(
  function (username, password, done) {
    var user = {
      id: '1',
      username: 'admin',
      password: 'pass'
    }; // 可以配置通过数据库方式读取登陆账号

    if (username !== user.username) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (password !== user.password) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    return done(null, user);
  }
));
passport.use(new GithubStrategy({
  clientID: '945b550396ae11844a1a',
  clientSecret: 'f093613f65901568ef4767a11ce769235a11037d',
  callbackURL: 'http://localhost:3001/auth/github/callback'
}, function (accessToken, refreshToken, profile, cb) {
  cb(null, profile)
  // User.findOrCreate({ githubId: profile.id }, function (err, user) {
  //   user.accessToken = accessToken
  //   console.log(user, '-----')
  //   return cb(err, user);
  // });
}))
passport.serializeUser(function (user, done) {//保存user对象
  done(null, user.username);
  // done(null, user);//可以通过数据库方式操作
});

passport.deserializeUser(function (user, done) {//删除user对象
  User.get(username, function (err, user) {
    done(err, user);
  });
  // done(null, user);//可以通过数据库方式操作
});

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/users',
    failureRedirect: '/'
  }));

app.post('/login', passport.authenticate('local'), function (req, res) {
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    User.get(req.body.username, function (err, docs) {
        if (!docs.length) {
            req.flash('error', '用户名不存在！');
            return res.redirect('/login');
        }
        if (docs[0].password != password) {
            req.flash('error', '密码错误！');
            return res.redirect('/login');
        }
        req.session.user = docs[0];
        req.flash('success', '登录成功!');
        res.redirect('/');
    });
});

app.get('/auth/github', passport.authenticate('github', {scope: 'email'}));
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login'}),
  function (req, res) {
    console.log(req.user)
    req.session.user = {
      username: req.user.username
    }
    res.redirect('/')
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
