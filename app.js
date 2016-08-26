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

    fs = require('fs'),
    accessLog = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a', encoding: 'utf8'}),
    errorLog = fs.createWriteStream(path.join(__dirname, 'error.log'), {flags: 'a', encoding: 'utf8'}),

    app = express(),
    passport = require('passport');

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

app.use(flash());

app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, './uploads')));

app.use(passport.initialize());



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
