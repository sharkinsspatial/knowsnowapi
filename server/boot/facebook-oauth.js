var PassportConfigurator =
    require('loopback-component-passport').PassportConfigurator;

module.exports = function(app) {
    var passportConfigurator = new PassportConfigurator(app);
    var passport = passportConfigurator.init();

    var strategy = 'facebook-login';
    var opts = require('../../providers.json')[strategy];

    opts.session = opts.session !== false;

    opts.customCallback = function (req, res, next) {
        passport.authenticate(
            strategy,
            {session: false},
            //See http://passportjs.org/guide/authenticate/
            // err, user, and info are passed to this by passport
            function(err, user, info) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    // TODO - we might want to add some params here too for failures.
                    return res.redirect(opts.failureRedirect);
                }

                var redirect = opts.successRedirect + '?' + 'access_token=' +
                    info.accessToken.id + '&userId=' + user.id.toString()
                return res.redirect(redirect);
            }
        )(req, res, next);
    };

    passportConfigurator.setupModels({
        userModel: app.models.User,
        userIdentityModel: app.models.UserIdentity,
        userCredentialModel: app.models.UserCredential
    });

    passportConfigurator.configureProvider(strategy, opts);
};
