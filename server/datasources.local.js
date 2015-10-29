require('dotenv').load();
var mongoUri = process.env.MONGOLAB_URL ||
    'mongodb://localhost/mydb';
module.exports = {
    mongodb: {
        defaultForType: "mongodb",
        connector: "loopback-connector-mongodb",
        url: mongoUri
    }
};
