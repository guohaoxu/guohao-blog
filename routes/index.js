var crypto = require('crypto'),
    User = require('../models/user.js'),
    Article = require('../models/article.js'),
    Comment = require('../models/comment.js'),
    multer = require('multer'),
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            var tmpStr = file.originalname;
            var str = tmpStr.slice(tmpStr.indexOf('.'), tmpStr.length);
            cb(null, req.session.user.username + '_tmp_' + str);
        }
    }),
    upload = multer({ storage: storage }),
    util = require('util');

module.exports = function (app) {
    var ctx;
    if (app.get('env') === 'development') {
        ctx = "http://localhost:" + app.get('port');
    } else {
        ctx = "http://static.guohaoxu.com";
    }

	app.get('/', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        Article.getTen(null, page, function (err, articles, total) {
            if (err) {
                articles = [];
            }
            var tmp = 0;
            if (articles.length) {
                articles.forEach(function (article, index) {
                    (function (article) {
                        User.get(article.author, function (err, docs) {
                            article.tx = docs[0].tx;
                            tmp++;
                            if (tmp == articles.length) {
                                res.render('index', {
                                    title: '这是首页',
                                    ctx: ctx,
                                    nav: 'home',
                                    user: req.session.user,
                                    articles: articles,
                                    page: page,
                                    isFirstPage: (page - 1) === 0,
                                    isLastPage: ((page - 1) * 10 + articles.length) == total,
                                    success: req.flash('success').toString(),
                                    error: req.flash('error').toString()
                                });
                            }
                        });
                    })(article);
                });
            } else {
                res.render('index', {
                    title: '这是首页',
                    ctx: ctx,
                    nav: 'home',
                    user: req.session.user,
                    articles: articles,
                    page: page,
                    isFirstPage: (page - 1) === 0,
                    isLastPage: ((page - 1) * 10 + articles.length) == total,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            }
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

    app.get('/logout', checkLogin, function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
    });

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
        if (req.body.username.length < 2 || req.body.password.length < 2 || req.body['password-repeat'].length < 2) {
            req.flash('error', '缺少输入！');
            return res.redirect('/reg');
        }
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致！');
            return res.redirect('/reg');
        }
        var md5 = crypto.createHash('md5'),
            newUser = new User({
                username: req.body.username,
                password: md5.update(req.body.password).digest('hex')
            });
        User.get(newUser.username, function (err, docs) {
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
                req.flash('success', '注册成功!请完善个人信息!');
                res.redirect('/set');
            });
        });
    });

    app.get('/set', checkLogin, function (req, res) {
        res.render('set', {
            nav: '',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/set', checkLogin, function (req, res) {
        console.log('---------2-------------');
        var desc = req.body.userdesc,
            username = req.session.user.username,
            x1 = req.body.x1,
            y1 = req.body.y1,
            wh = req.body.WH,
            imgSrc = req.body.imgSrc;

        var tx = req.body.imgSrcEnd;
        console.log(tx + '----------------------');

        User.update(username, desc, tx, function (err, result) {
            req.flash('success', '设置成功!');
            res.redirect('/u/' + username);
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
            tags = [req.body.tag1, req.body.tag2, req.body.tag3],
            article = new Article(currentUser.username, req.body.title, tags, req.body.content);
        article.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功！');
            res.redirect('/');
        });
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
    app.post('/upload', checkLogin, upload.array('txFile'), function (req, res) {
        //req.flash('success', '文件上传成功！');
        //res.redirect('/');
    });

    app.get('/u/:author', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        User.get(req.params.author, function (err, docs) {
            if (!docs.length) {
                req.flash('error', '用户名不存在！');
                return res.redirect('/');
            }
            Article.getTen(req.params.author, page, function (err, articles, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                articles.tx = docs[0].tx;
                articles.author = docs[0].username;
                articles.desc = docs[0].desc;
                res.render('user', {
                    title: '这是' + docs[0].name + '的主页',
                    ctx: ctx,
                    nav: '',
                    user: req.session.user,
                    articles: articles,
                    page: page,
                    isFirstPage: (page - 1) === 0,
                    isLastPage: ((page - 1) * 10 + articles.length) == total,
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
    app.post('/u/:author/:day/:title', function (req, res) {
        var date = new Date(),
            year = date.getFullYear(),
            month = (date.getMonth() + 1) < 10 ? ('0' + (date.getMonth() + 1)): (date.getMonth() + 1),
            day = date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate(),
            hour = date.getHours() < 10 ? ('0' + date.getHours()) : date.getHours(),
            minute = date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes();
        var time = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
        var comment = {
            username: req.body.username,
            website: req.body.website,
            time: time,
            content: req.body.content
        };

        var newComment = new Comment(req.params.author, req.params.day, req.params.title, comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '评论成功！');
            res.redirect('back');
        });

    });
    app.get('/edit/:author/:day/:title', checkLogin, function (req, res) {
        var currentUser = req.session.user;
        Article.edit(currentUser.username, req.params.day, req.params.title, function (err, article) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('edit', {
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
    app.post('/edit/:author/:day/:title', checkLogin, function (req, res) {
        var currentUser = req.session.user;
        Article.update(currentUser.username, req.params.day, req.params.title, req.body.content, function (err, article) {
            var url = encodeURI('/u/' + req.params.author + '/' + req.params.day + '/' + req.params.title);
            if (err) {
                req.flash('error', err);
                return res.redirect(url);
            }
            req.flash('success', '修改成功！');
            res.redirect(url);
        });
    });
    app.get('/remove/:author/:day/:title', checkLogin, function (req, res) {
        var currentUser = req.session.user;
        Article.remove(currentUser.username, req.params.day, req.params.title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '删除成功！');
            res.redirect('/');
        });
    });

    app.get('/tags', function (req, res) {
        var tags = {
            tagNames: [],
            num: [],
            author: []
        };
        Article.getTags(function (err, tagNames) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            tags.tagNames = tagNames;
            var tmp = 0;
            tagNames.forEach(function (tagName, index) {
                Article.getTag(tagName, function (err, articles) {
                    tags.num[index] = articles.length;
                    tags.author[index] = articles[0].author;
                    tmp++;
                    if (tmp == (tagNames.length)) {
                        res.render('tags', {
                            ctx: ctx,
                            nav: 'tags',
                            tags: tags,
                            user: req.session.user,
                            success: req.flash('success').toString(),
                            error: req.flash('error').toString()
                        });
                    }
                });
            });
        });
    });

    app.get('/tags/:tag', function (req, res) {
        Article.getTag(req.params.tag, function (err, articles) {
            if (err) {
                req.flash('error', err);
                return res.direct('/');
            }
            var tmp = 0;
            if (articles.length) {
                articles.forEach(function (article, index) {
                    (function (article) {
                        User.get(article.author, function (err, docs) {
                            article.tx = docs[0].tx;
                            tmp++;
                            if (tmp == articles.length) {
                                res.render('tag', {
                                    title: 'TAG:' + req.params.tag,
                                    ctx: ctx,
                                    tag: req.params.tag,
                                    nav: 'tags',
                                    articles: articles,
                                    user: req.session.user,
                                    success: req.flash('success').toString(),
                                    error: req.flash('error').toString()
                                });
                            }
                        });
                    })(article);
                });
            } else {
                res.render('tag', {
                    title: 'TAG:' + req.params.tag,
                    ctx: ctx,
                    tag: req.params.tag,
                    nav: 'tags',
                    articles: articles,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            }
        });
    });

    app.get('/search', function (req, res) {
        Article.search(req.query.keyword, function (err, docs) {
            if (err) {
                req.flash('error', err);
                res.redirect('/');
            }
            docs.forEach(function (doc, index) {
                var tmpStr = doc.title.replace(req.query.keyword, '<span class="keyword">' + req.query.keyword + '</span>');
                doc.title2 = tmpStr;
            });
            res.render('search', {
                title: 'SEARCH:' + req.query.keyword,
                ctx: ctx,
                nav: '',
                articles: docs,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/links', function (req, res) {
        res.render('links', {
            title: '友情链接',
            ctx: ctx,
            nav: 'links',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
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

};
