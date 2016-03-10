var MongoClient = require('mongodb').MongoClient,
    settings = require('../settings.js'),
    url = settings.url;

function Comment(author, day, title, comment) {
    this.author = author;
    this.day = day;
    this.title = title;
    this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function (callback) {
    var author = this.author,
        day = this.day,
        title = this.title,
        comment = this.comment;
    
    MongoClient.connect(url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('articles').update({
            "author": author,
            "time.day": day,
            "title": title
        }, {
            $push: { 'comments': comment }
        }, function (err) {
            db.close();
            if (err) {
                return callback(err);
            }
            callback(null);
        });
    });
    
};