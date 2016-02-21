var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings.js'),
    url = settings.url,
    markdown = require('markdown').markdown;

function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}

module.exports = Post;

//存储一篇新文章
Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getHours() + ":" +(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post
    };
    
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts').insert(post, function (err, result) {
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
Post.getAll = function (name, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        var query = {};
        if (name) {
            query.name = name;
        }
        db.collection('posts').find(query).sort({
            time: -1
        }).toArray(function(err, docs) {
            db.close();
            if (err) {
                return callback(err);
            }
            docs.forEach(function (doc) {
                doc.post = markdown.toHTML(doc.post);
            });
            callback(null, docs);
        });
    });
};

//读取一篇文章
Post.getOne = function (name, day, title, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);    
        }
        db.collection('posts').findOne({
            name: name,
            'time.day': day,
            title: title
        }, function (err, doc) {
            db.close();
            if (err) {
                return callback(err);
            }
            doc.post = markdown.toHTML(doc.post);
            callback(null, doc);
        });
    });
}

Post.edit = function (name, day, title, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts').findOne({
            name: name,
            'time.day': day,
            title: title
        }, function (err, doc) {
            db.close();
            if (err) {
                return callback(err);
            }
            return  callback(null, doc);
        });
    });
}








//20160221