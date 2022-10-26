#!/usr/bin/env node

"use strict";
/**
 * MediaScape SharedState - express.js
 * Simple Express Server
 *
 * @author Andreas Bosl <bosl@irt.de>
 * @copyright 2014 Institut für Rundfunktechnik GmbH, All rights reserved.
 */

function ExpressServer(db) {
    var that;
    var config = require('../config');
    var log4js = require('log4js');
    log4js.configure(config.logConfig);
    var logger = log4js.getLogger('ExpressServer');
    var path = require("path");
    var fs = require('fs');
    // Setup express server
    var express = require('express');
    var compression = require('compression');
    var app = express();
    var server = require('http').createServer(app);
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    var session = require('express-session');
    var MongoStore = require('connect-mongo')(session);
    var base58 = require('./base58.js');
    var path = require('path');
    var Url = db.getShortenModel();
    var profilingService= require('deviceprofiler')
    var https = require('https');
    var persistency = require('./Persistence.js')
    var cors = require('cors')
    var subdomain = require('vhost');

  // configure Express
  app.use(cookieParser());
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  app.use(
    session({
      secret: config.auth.session_secret,
      name: config.auth.session_name,
      proxy: true,
      resave: true,
      saveUninitialized: true,
      store: new MongoStore({
        url: config.mongoose.uri + "session",
      }),
      cookie: { httpOnly: false },
    })
  );


   app.use(cors({ origin: true, credentials: true }));
   persistency(app,db);
   profilingService.listen(app);
   app.post('/api/shorten', function(req, res){
          var longUrl = req.body.url;
	        logger.debug("shorten url",longUrl);
          var shortUrl = '';

          // check if url already exists in database
          Url.findOne({long_url: longUrl}, function (err, doc){
	    if (err) logger.error(err);
            if (doc){
              shortUrl = config.webhost +"/s/"+ base58.encode(doc.__id);

              // the document exists, so we return it without creating a new entry 
              res.send({'shortUrl': shortUrl});
            } else {
              // since it doesn't exist, let's go ahead and create it:
              var newUrl = Url({
                long_url: longUrl
              });

              // save the new link
              newUrl.save(function(err) {
                if (err){
                  logger.error(err);
                }
                shortUrl = config.webhost  +"/s/"+ base58.encode(newUrl.__id);
		
                res.send({'shortUrl': shortUrl});
              });
            }

          }).catch(ex=>logger.warn(ex));

    });
   app.get("/s/:encoded_id", function (req, res) {
      var base58Id = req.params.encoded_id;
      var id = base58.decode(base58Id);
      logger.info("S shorten",id);
      // check if url already exists in database
      Url.findOne({__id: id}, function (err, doc){
        if (doc) {
                logger.info("found shotern url",doc);
                res.redirect(doc.long_url);

        } else {
                logger.debug("url shorten not found");
                res.redirect(config.webhost);
        }
      });

  })
	
app.use(function (req, res, next) {
  req.originalUrl = req.headers['x-original-url'] || undefined
  next()
})
app.use(
        subdomain(config.express.domain,express.static(path.join(__dirname, "..",config.express.filePath), { maxAge: 86400000 * 7 ,extensions:['html']}))
);
	

/*
app.use(subdomain(config.express.domain,function handle (req, res, next) {
                console.log("here2");
                let reqPath = path.join(__dirname, '../');
                res.sendFile(path.join(reqPath,config.express.filePath,"index.html"));
        }
))
*/
app.get('*',function(req,res,next) {
	let reqPath = path.join(__dirname, '../');
        res.sendFile(path.join(reqPath,config.express.filePath,"index.html"));
})
	
if (config.express.subdomain){
        console.log(config.express.subdomain);
        app.use(
                subdomain(config.express.subdomain.host,
                          express.static(path.join(__dirname,config.express.subdomain.filePath), { maxAge: 86400000 * 7,extensions:['html'] })
                         )
        );
        app.use(subdomain(config.express.subdomain.host,function handle (req, res, next) {
                console.log("here");
		if (req.path.indexOf("/getShows")==-1)
                res.sendFile(path.join(__dirname,config.express.subdomain.filePath,"index.html"));
        }))

 }



  app.use(compression({ threshold: 0 }));
  app.use(function (req, res, next) {
    var filename = path.basename(req.url);
    logger.debug("The file " + filename + " was requested.");
    next();
  });

  const { USE_HTTPS } = process.env;
  const httpsServer = USE_HTTPS === 'true' ? https.createServer(
    {
      key: fs.readFileSync(path.resolve(__dirname, "../cert/key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "../cert/cert.pem")),
      secureProtocol: "TLSv1_2_method",
    },
    app
  ) : null;
  if (httpsServer) {
    httpsServer.listen(config.express.sslPort, function() {
      logger.debug(`HTTPS Server listening at port ${config.express.sslPort}...`)
    });
  }
  server.listen(config.express.port, function () {
    logger.debug("Webserver listening at port %d", config.express.port);
  });

  // Simple route middleware to ensure user is authenticated.
  //   Use this route middleware on any resource that needs to be protected.  If
  //   the request is authenticated (typically via a persistent login session),
  //   the request will proceed.  Otherwise, the user will be redirected to the
  //   login page.
  function ensureAuthenticated(req, res, next) {
    logger.info(req.isAuthenticated());
    if (req.isAuthenticated()) {
      return next();
    } else res.redirect("index.html");
    if (!config.auth.useAuthentication) {
      return next();
    }
  }

  function getServer() {
    return httpsServer ? httpsServer : server;
  }

  that = {
    getServer: getServer,
  };

  return that;
}

module.exports = ExpressServer;
