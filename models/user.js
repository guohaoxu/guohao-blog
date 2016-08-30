var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings.js'),
    url = process.dbURL || settings.url;

function User(user) {
    this.username = user.username;
    this.password = user.password;
    this.email = user.email;
    this.githubId = this.githubId;
    this.tx = 'default.jpg';
    this.desc = user.desc;
    this.accessToken = user.accessToken;
}

module.exports = User;

//存储新用户信息
User.prototype.save = function (callback) {
    var user = {
        username: this.username,
        password: this.password,
        email: this.email,
        githubId: this.githubId,
        tx: this.tx,
        desc: this.desc,
        accessToken: this.accessToken
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

User.findOrCreate = function (query, query2, callback) {
  MongoClient.connect(url, function (err, db) {
    if (err) return callback(err);
    db.collection('users').find(query).toArray(function(err, docs) {

      if (err) {
        db.close();
        return callback(err);
      }
      if (!docs.length) {
        db.collection('users').insertOne({
          username: query.username,
          githubId: query2.id,
          displayName: query2.displayName,
          email: query2.emails[0].value,
          tx: query2.photos[0].value,
          token: query2.accessToken
        }, function (err, r) {
          db.close()
          return callback(null, r)
        })
      }
      callback(null, docs[0]);
    });
  });
}

User.findByUsername = function (username, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) return callback(err);
        db.collection('users').find({username: username}).toArray(function(err, docs) {
            db.close();
            if (err)  return callback(err);
            callback(null, docs[0]);
        });
    });
};

//读取用户信息
User.get = function (username, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) return callback(err);
        db.collection('users').find({username: username}).toArray(function(err, docs) {
            db.close();
            if (err)  return callback(err);
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
        if (tx) {
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
        } else {
            col.findOneAndUpdate({
                username: username
            }, {
                $set: {
                    desc: desc
                }
            }, function (err, result) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, result.value);
            });
        }

    });
};
