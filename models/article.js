var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings.js'),
    url = settings.url,
    markdown = require('markdown').markdown;

function Article(author, title, tags, content) {
    this.author = author;
    this.title = title;
    this.tags = tags;
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
        tags: this.tags,
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

//读取10篇文章
Article.getTen = function (author, page, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        var query = {};
        if (author) {
            query.author = author;
        }
        db.collection('articles').count(query, function (err, total) {
            db.collection('articles').find(query, {
                skip: (page - 1) * 10,
                limit: 10
            }).sort({
                time: -1
            }).toArray(function (err, results) {
                db.close();
                if (err) return callback(err);
                results.forEach(function (doc) {
                    doc.content = markdown.toHTML(doc.content);
                });
                callback(null, results, total);
            });
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

//获取编辑一篇文章
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

//修改一篇文章
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

//删除一篇文章
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

//返回所有文章存档信息
Article.getArchive = function (callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('articles').find({}, {
            'author': 1,
            'time': 1,
            'title': 1
        }).sort({
            time: -1
        }).toArray(function (err, results) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null, results);
        })
    })
}

//返回所有tags
Article.getTags = function (callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('articles').distinct('tags', function (err, docs) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null, docs);
        })
    })
}

//返回特定标签的所有文章
Article.getTag = function (tag, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('articles').find({
            "tags": tag
        }).sort({
            time: -1
        }).toArray(function (err, docs) {
            db.close();
            if (err) {
                return callback(err);
            }
            docs.forEach(function (doc) {
                doc.content = markdown.toHTML(doc.content);
            });
            callback(null, docs);
        })
    })
}





//20160221