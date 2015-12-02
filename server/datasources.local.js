require('dotenv').config({silent: true});
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
    },
    fileStorageDS: {
        root: "./upload",
        acl: 'public-read',
        allowedContentTypes: ['image/jpg', 'image/jpeg'],
        maxFileSize: 5 * 1024 * 1024,
        getFilename: function(fileInfo) {
            var fileName = fileInfo.name.replace(/\s+/g, '-').toLowerCase();
            return 'image-' + new Date().getTime() + '-' + fileName;
        }
    }
};
