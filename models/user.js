var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings.js'),
    url = settings.url;

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

//存储新用户信息
User.prototype.save = function (callback) {
    var user = {
        name: this.name,
        password: this.password,
        email: this.email
    };
    
    MongoClient.connect(url, function (err, db) {
        if (err) {
           return callback(err);
        }
        db.collection('users').insertOne(user, function (err, result) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    });
}

//读取用户信息
User.get = function (username, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('users').find({name: username}).toArray(function(err, docs) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null, docs);
        });
    });
}