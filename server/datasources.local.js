require('dotenv').load();
var mongoUri = process.env.MONGOLAB_URL ||
    'mongodb://localhost/mydb';
var mailGunAPIKey = process.env.MAILGUN_API_KEY;
var mailGunDomain = process.env.MAILGUN_DOMAIN;
module.exports = {
    mongodb: {
        defaultForType: "mongodb",
        connector: "loopback-connector-mongodb",
        url: mongoUri
    },
    email: {
        name: "mail",
        connector: "mail",
        transports: [
        {
            type: "Mailgun",
            auth: {
                api_key: mailGunAPIKey,
                domain: mailGunDomain
            }
        }
        ]
    }
};
