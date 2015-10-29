var PassportConfigurator =
    require('loopback-component-passport').PassportConfigurator;

module.exports = function(app) {
    var passportConfigurator = new PassportConfigurator(app);
    var passport = passportConfigurator.init();

    var strategy = 'facebook-login';
    var opts = require('../../providers.json')[strategy];

    // Doesn't look like we need this..yet, but it would be good to set proper options
    // up front so we can use the proper values directly below.
    opts.session = opts.session !== false;

    opts.customCallback = function (req, res, next) {
        // We need url, because we want to use to to parse the url and then reformat it with params.
        var url = require('url');

        // Note that we have to only use variables that are in scope right now, like opts.
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
                // Add the tokens to the callback as params.
                var redirect = url.parse(opts.successRedirect, true);

                // this is needed or query is ignored. See url module docs.
                delete redirect.search;

                redirect.query = {
                    'access_token': info.accessToken.id,
                    // Note the .toString here is necessary.
                    'userId': user.id.toString()
                };
                // Put the url back together. It should now have params set.
                redirect = url.format(redirect);
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
