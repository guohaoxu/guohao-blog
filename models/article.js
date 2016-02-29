var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings.js'),
    url = settings.url,
    markdown = require('markdown').markdown;

function Article(author, title, content) {
    this.author = author;
    this.title = title;
    this.content = content;
}

module.exports = Article;

//存储一篇新文章
Article.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" +(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    
    var article = {
        author: this.author,
        time: time,
        title: this.title,
        content: this.content,
        comments: []
    };
    
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('articles').insert(article, function (err, result) {
            db.close();
            if (err) {
                db.close();
               return callback(err);
            }
            callback(null, result);
        });
    });
};

//读取多篇文章
Article.getAll = function (author, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        var query = {};
        if (author) {
            query.author = author;
        }
        db.collection('articles').find(query).sort({
            time: -1
        }).toArray(function(err, docs) {
            db.close();
            if (err) {
                return callback(err);
            }
            docs.forEach(function (doc) {
                doc.content = markdown.toHTML(doc.content);
            });
            callback(null, docs);
        });
    });
};

//读取一篇文章
Article.getOne = function (author, day, title, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);    
        }
        db.collection('articles').findOne({
            author: author,
            'time.day': day,
            title: title
        }, function (err, doc) {
            db.close();
            if (err) {
                return callback(err);
            }
            doc.content = markdown.toHTML(doc.content);
            if (doc.comments) {
                doc.comments.forEach(function (comment) {
                   comment.content = markdown.toHTML(comment.content); 
                });
            }
            callback(null, doc);
        });
    });
}

Article.edit = function (author, day, title, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);    
        }
        db.collection('articles').findOne({
            author: author,
            'time.day': day,
            title: title
        }, function (err, doc) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null, doc);
        });
    });
}

Article.update = function (author, day, title, content, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);    
        }
        db.collection('articles').update({
            author: author,
            'time.day': day,
            title: title
        }, {
            $set: {
                content: content
            }
        }, function (err) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null);
        });
    });
}

Article.remove = function (author, day, title, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);    
        }
        db.collection('articles').remove({
            author: author,
            'time.day': day,
            title: title
        }, {
            w: 1
        }, function (err) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null);
        });
    });
}







//20160221