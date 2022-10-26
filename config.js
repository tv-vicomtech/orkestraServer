/**

 * configuration file
 *
 * @author Andreas Bosl <bosl@irt.de>
 * @copyright 2014 Institut für Rundfunktechnik GmbH, All rights reserved.
 */

var os = require('os')
var config = {};

config.auth = {
    useAuthentication: false, // Authentication Enabled true/false
    GOOGLE_CLIENT_ID: "--- XYZ ---", // obtain from https://console.developers.google.com/project
    GOOGLE_CLIENT_SECRET: "--- XYZ ---", // obtain from https://console.developers.google.com/project
    GOOGLE_CALLBACK_URL: "http:// --- XYZ ---/auth/google/callback", // Your Domain + /auth/google/callback
    session_secret: 'ForLittleKnowsMyRoyalDameThatRumpelstiltskinIsMyName!', // secret for the session cookie
    session_name: 'mappingAuth' // name for the session cookie
};

const ipMongo = process.env.DOMAIN_MONGO || "127.0.0.1";
const dbName = process.env.DBNAME || "orkestra";

// config for mongodb / mongoose
config.mongoose = {
    uri: `mongodb://${ipMongo}/${dbName}`,
    options:{
        keepAlive: 1,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify:false
    }
};
// TableName used for mapping
config.mappingPath = 'mappingTable';

// config for express server
config.express = {
    port: process.env.PORT || 80,
    filePath: './www',
    sslPort:443,
    domain:"stage.traction-project.eu",
    subdomain:{
        host:"devstage.traction-project.eu",
        filePath:'../www/dev'
    }
};

// which DB to use
config.db = {
    file: './MongoDB.js' // MongoDB
};



// Config for log4js
config.logConfig = {
    appenders: {
        app:{
            type: 'file',
            filename: './log/backend.log',
            maxLogSize: 10240,
            backups: 3
        },
       out: {
            type: "console"
        }
    },
    categories: {
        default: { appenders: [ 'out', 'app' ], level: 'info' }
    },
    replaceConsole: true
};

config.aggregate = false;
config.webhost = "https://stage.traction-project.eu"
module.exports = config;
