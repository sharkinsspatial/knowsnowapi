require('dotenv').config({silent: true});
var path = require('path');
module.exports = function(app) {
    var User = app.models.User;
    User.afterRemote('create', function(context, user, next) {
        var redirect = encodeURIComponent(process.env.SUCCESS_REDIRECT);
        var userModel = user.constructor;
        var verifyHref = 'http://'
            + process.env.HOST_URL
            + '/api'
            + userModel.http.path
            + '/confirm'
            + '?uid='
            + user.id
            + '&redirect='
            + redirect

        var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@gatineauxc.ca',
            subject: 'Thanks for registering for Gatineau XC',
            template: path.resolve(__dirname, '../../node_modules/loopback/templates/verify.ejs'),
            verifyHref: verifyHref
        };

        user.verify(options, function(err, response, next) {
            if (err) {
                next(err);
                return;
            }

            context.res.setHeader('Content-Type', 'application/json');
            context.res.send(JSON.stringify({emailSent: true}));
        });
    });
}
