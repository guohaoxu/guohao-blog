var crypto = require('crypto'),
    User = require('../models/user.js'),
    Article = require('../models/article.js'),
    multer = require('multer'),
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/')
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname )
        }
    }),
    upload = multer({ storage: storage });

module.exports = function (app) {
    var ctx;
    if (app.get('env') === 'development') {
        ctx = "http://localhost:" + app.get('port');
    } else {
        ctx = "http://static.guohaoxu.com";
    }
    
	app.get('/', function (req, res) {
        Article.getAll(null, function (err, articles) {
            if (err) {
                articles = [];
            } 
            res.render('index', {
                title: '这是首页',
                ctx: ctx,
                nav: 'home',
                user: req.session.user,
                articles: articles,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
	});
    app.get('/login', checkNotLogin, function (req, res) {
        res.render('login', {
            title: '这是登录页',
            ctx: ctx,
            nav: 'login',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin, function (req, res) {
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function (err, docs) {
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
    
    app.get('/logout', checkLogin, function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
    })
    
    app.get('/reg', checkNotLogin, function (req, res) {
       res.render('reg', {
           title: '这是注册页',
            ctx: ctx,
           nav: 'reg',
           user: req.session.user,
           success: req.flash('success').toString(),
           error: req.flash('error').toString()
       });
    });
    app.post('/reg', checkNotLogin, function (req, res) {
        var password = req.body.password,
            password_re = req.body['password-repeat'];
        if (req.body.name.length < 2 || req.body.password.length < 2 || req.body['password-repeat'].length < 2) {
            req.flash('error', '缺少输入！');
            return res.redirect('/reg');
        }
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致！');
            return res.redirect('/reg');
        }
        var md5 = crypto.createHash('md5'),
            newUser = new User({
                name: req.body.name,
                password: md5.update(req.body.password).digest('hex'),
                email: req.body.email
            });
        User.get(newUser.name, function (err, docs) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            if (docs.length) {
                req.flash('error', '用户名已存在！');
                return res.redirect('/reg');
            }
            newUser.save(function (err, result) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success', '注册成功！');
                res.redirect('/');
            });
        });
    });
    
    app.get('/post', checkLogin, function (req, res) {
        res.render('post', {
            title: '发表',
            ctx: ctx,
            nav: 'article',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin, function (req, res) {
        var currentUser = req.session.user,
            article = new Article(currentUser.name, req.body.title, req.body.post);
        article.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功！');
            res.redirect('/');
        })
    });
    
    app.get('/upload', checkLogin, function (req, res) {
        res.render('upload', {
            title: '文件上传',
            ctx: ctx,
            nav: 'upload',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    }); 
    app.post('/upload', checkLogin, upload.array('imgfile'), function (req, res) {
        req.flash('success', '文件上传成功！');
        res.redirect('/');
    });
    
    app.get('/u/:author', function (req, res) {
        User.get(req.params.author, function (err, docs) {
            if (!docs.length) {
                req.flash('error', '用户名不存在！');
                return res.redirect('/');
            }
            Article.getAll(req.params.author, function (err, articles) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: '这是' + docs[0].name + '的主页',
                    ctx: ctx,
                    nav: '',
                    user: req.session.user,
                    articles: articles,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });
    app.get('/u/:author/:day/:title', function (req, res) {
        Article.getOne(req.params.author, req.params.day, req.params.title, function (err, article) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                ctx: ctx,
                nav: '',
                article: article,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/edit/:author/:day/:title', checkLogin, function (req, res) {
        var currentUser = req.session.user;
        Article.edit(currentUser.name, req.params.day, req.name.title, function (err, article) {
            if (err) {
                req.flash('error', err);
                return res.direct('back');
            }
            res.render('edit', {
                title: '编辑',
                article: article,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    
    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录！');
            return res.redirect('/login');
        }
        next();
    }
    
    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录！');
            return res.redirect('back');
        }
        next();
    }
        
}