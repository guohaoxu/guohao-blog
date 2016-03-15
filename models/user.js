var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings.js'),
    url = settings.url;

function User(user) {
    this.username = user.username;
    this.password = user.password;
    this.email = user.email;
    this.tx = 'default.jpg';
    this.desc = user.desc;
}

module.exports = User;

//存储新用户信息
User.prototype.save = function (callback) {
    var user = {
        username: this.username,
        password: this.password,
        email: this.email,
        tx: this.tx,
        desc: this.desc,
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
};

//读取用户信息
User.get = function (username, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('users').find({username: username}).toArray(function(err, docs) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null, docs);
        });
    });
};

//更新个人信息
User.update = function (username, desc, tx, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        var col = db.collection('users');
        col.findOneAndUpdate({
            username: username
        }, {
            $set: {
                desc: desc,
                tx: tx
            }
        }, function (err, result) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null, result.value);
        });
    });
};

