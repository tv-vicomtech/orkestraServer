
#!/usr/bin/env node

"use strict";
/**
 * Main startpoint
 *
 * @author Andreas Bosl <bosl@irt.de>
 * @copyright 2014 Institut für Rundfunktechnik GmbH, All rights reserved.
 */

// Load environment variables from .env file
require('dotenv').config()

var config = require('./config');
var fs = require( 'fs' );
if ( !fs.existsSync( 'log' ) ) {
        // Create the directory if it does not exist
    fs.mkdirSync( 'log' );
        //fs.writeFile('./log/backend.log', '', 'utf8');
}

var log4js = require('log4js');
log4js.configure(config.logConfig);
var logger = log4js.getLogger('flexcontrol');


require('./lib/core')();


process.on('SIGINT', function () {
    logger.info('Got a SIGINIT - terminating');
    process.exit(0);
});
