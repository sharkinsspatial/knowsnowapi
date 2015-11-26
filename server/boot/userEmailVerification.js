require('dotenv').load();
var path = require('path');
module.exports = function(app) {
    var User = app.models.User;
    User.afterRemote('create', function(context, user, next) {
        var redirect = encodeURIComponent(process.env.SUCCESS_REDIRECT);
        var options = {
            type: 'email',
            to: user.email,
            from: 'noreply@knowsnow.ca',
            subject: 'Thanks for registering for Know Snow',
            template: path.resolve(__dirname, '../../node_modules/loopback/templates/verify.ejs'),
            redirect: redirect,
            host: process.env.HOST
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
