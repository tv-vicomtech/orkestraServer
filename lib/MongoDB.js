#!/usr/bin/env node

"use strict";
/**
 * MongoDB.js
 * handles the connection to MongoDB
 *
 * @author Andreas Bosl <bosl@irt.de>
 * @copyright 2014 Institut für Rundfunktechnik GmbH, All rights reserved.
 */
function MongoDB() {
    var that;

    var EventEmitter = require('events').EventEmitter;

    var config = require('../config');

    var log4js = require('log4js');
    log4js.configure(config.logConfig);
    var logger = log4js.getLogger('MongoDB');
    var crypto = require('crypto');

    var db = null;

    var stateModels = {};
    var userModel = {};
    var appModel = {};
    var showAppModel = {};
    var userAppModel = {};
    var groupModel = {};
    var usedIds = [];
    var Url = {};
    var userCollect = false;
    var appCollect = false;
    var userAppCollect = false;
    var groupCollect = false;


    function init() {

        db = require('mongoose');
        db.connection.on('error', (error) => {
            logger.error('Couldn\'t connect to DB: ', error.name, error.message);
            logger.error('terminating')
            process.exit(1);
        });
        db.connection.once('open', () => {
            logger.info('Connection to DB established');
        });
        db.set('useCreateIndex', true);
        db.set("useUnifiedTopology", true);
        db.connect(config.mongoose.uri, config.mongoose.options).catch((e) => logger.info(e));


        var safe = {
            w: 0,
            wtimeout: 10000
        };

        var showSchema = new db.Schema({
            name: {
                type: String,
                unique: true
            },
            show: {
                type: String,
                unique: false
            }
        }, {
            writeConcern: safe
        });

        var userSchema = new db.Schema({
            userId: {
                type: String,
                unique: true
            },
            service: {
                type: String,
                unique: true
            }
        }, {
            writeConcern: safe
        });

        var appSchema = new db.Schema({
            appId: {
                type: String,
                unique: true
            },
            service: {
                type: String,
                unique: true
            }
        }, {
            writeConcern: safe
        });

        var userAppSchema = new db.Schema({
            userId: {
                type: String

            },
            appId: {
                type: String
            },
            service: {
                type: String,
                unique: true
            }
        }, {
            writeConcern: safe
        });

        var groupSchema = new db.Schema({
            groupId: {
                type: String,
                unique: true
            },
            service: {
                type: String,
                unique: true
            }
        }, {
            writeConcern: safe
        });
        showAppModel = db.model('template' + '_show', showSchema);
        userModel = db.model(config.mappingPath + '_user', userSchema);
        appModel = db.model(config.mappingPath + '_app', appSchema);
        userAppModel = db.model(config.mappingPath + '_appUser', userAppSchema);
        groupModel = db.model(config.mappingPath + '_group', groupSchema);
        var CounterSchema = new db.Schema({
            _id: { type: String, required: true },
            seq: { type: Number, default: 0 }
        });

        var counter = db.model('counter', CounterSchema);
        counter.findOne({ _id: 'url_count' }, (err, cnt) => {
            if (err)
                return logger.error(err);
            if (!cnt) {
                var c = new counter({ _id: 'url_count', seq: 1 });
                c.save();
            }
        });
        // create a schema for our links
        var urlSchema = new db.Schema({
            __id: { type: Number, index: true },
            long_url: String,
            created_at: Date
        });

        urlSchema.pre('save', function (next) {
            var doc = this;
            counter.findByIdAndUpdate({ _id: 'url_count' }, { $inc: { seq: 1 } }, (error, counter) => {
                if (error)
                    return next(error);
                doc.created_at = new Date();
                doc.__id = counter.seq;
                next();
            });
        });

        Url = db.model('Url', urlSchema);
        collectServices();

    };

    function collectServices() {
        userModel.find({}, (err, docs) => {
            if (err) {
                logger.error(err);
            } else {
                for (var i = 0, len = docs.length; i < len; i++) {
                    usedIds.push(docs[i].service)
                }
            }
            userCollect = true;
            createPathes();
        });
        appModel.find({}, (err, docs) => {
            if (err) {
                logger.error(err);
            } else {
                for (var i = 0, len = docs.length; i < len; i++) {
                    usedIds.push(docs[i].service)
                }
            }
            appCollect = true;
            createPathes();
        });
        userAppModel.find({}, (err, docs) => {
            if (err) {
                logger.error(err);
            } else {
                for (var i = 0, len = docs.length; i < len; i++) {
                    usedIds.push(docs[i].service)
                }
            }
            userAppCollect = true;
            createPathes();
        });
        groupModel.find({}, (err, docs) => {
            if (err) {
                logger.error(err);
            } else {
                for (var i = 0, len = docs.length; i < len; i++) {
                    usedIds.push(docs[i].service)
                }
            }
            groupCollect = true;
            createPathes();
        });
    };




    function createPathes(newPath) {
        if (newPath) {
            var stateSchema = new db.Schema({
                key: {
                    type: String,
                    unique: true
                },
                value: db.Schema.Types.Mixed
            }, {
                writeConcern: {
                    w: 0,
                    wtimeout: 10000
                }
            });

            stateModels[newPath] = db.model(newPath, stateSchema);
        } else {
            if (userCollect && appCollect && userAppCollect && groupCollect) {
                for (var i = 0, len = usedIds.length; i < len; i++) {
                    var stateSchema = new db.Schema({
                        key: {
                            type: String,
                            unique: true
                        },
                        value: db.Schema.Types.Mixed
                    }, {
                        writeConcern: {
                            w: 0,
                            wtimeout: 10000
                        }
                    });

                    stateModels[usedIds[i]] = db.model(usedIds[i], stateSchema);
                }
                that.emit('newPath', usedIds);
            }
        }
    };









    function getState(path, data, callback) {
        let datagram = [];
        if (!data || data.length == 0) {
            stateModels[path].find({}, (err, docs) => {
                if (err) {
                    logger.error(err);
                } else {
                    for (let i = 0; i < docs.length; i++) {
                        let state = {};
                        state.type = 'set';
                        state.key = docs[i].key;
                        state.value = docs[i].value;
                        datagram.push(state);

                    }
                    callback(datagram);
                }

            });
        } else {
            let keys = [];
            for (let i = 0; i < data.length; i++) {
                keys.push(data.changeState[i].key);
            }

            stateModels[path].find({
                key: {
                    $in: keys
                }
            },
                (err, docs) => {
                    if (err) {
                        logger.error(err);
                    } else {
                        for (let i = 0; i < docs.length; i++) {
                            let state = {};
                            state.type = 'set';
                            state.key = docs[i].key;
                            state.value = docs[i].value;
                            datagram.push(state);

                        }
                        callback(datagram);
                    }
                });
        }
    };


    function changeState(path, data) {
        if (data && path) {

            for (let i = 0; i < data.length; i++) {
                let element = data[i];
                if (element.type == 'set') {
                    logger.debug("set", element)
                    stateModels[path].findOneAndUpdate({
                        key: element.key
                    }, {
                        $set: {
                            value: element.value
                        }
                    }, {
                        upsert: true,
                        setDefaultsOnInsert: true,
                        new: true
                    }).then((doc) => {

                        if (!doc) logger.info("not info modified", data, path);
                        else {
                            logger.debug("DB chnageState", doc._doc);
                            onChanged(path, doc._doc);
                        }
                        doc = undefined;
                    }).catch(err => {
                        logger.error("changeState", e)
                    })
                } else if (element.type == 'remove') {
                    stateModels[path].findOne({
                        key: element.key
                    }, (err, doc) => {
                        if (err) {
                            logger.error('DB-Error', err);
                        } else if (doc) {
                            doc.remove((err) => {
                                if (err) {
                                    logger.error('DB-Error', err);
                                } else {
                                    onRemoved(path, doc);
                                }
                            });
                        }
                    });
                }
                element = undefined;
            }
            data = undefined;

        }
    };

    function getUserMapping(request, callback) {

        let scopes = {};
        userModel.findOne({
            userId: request.userId
        }, (err, doc) => {
            if (err) {
                logger.error(err);
            } else {
                if (doc) {
                    scopes.user = doc.service;
                }
                appModel.findOne({
                    appId: request.appId
                }, (err, doc) => {
                    if (err) {
                        logger.error(err);
                    } else {
                        if (doc) {
                            scopes.app = doc.service;
                        }
                        userAppModel.findOne({
                            userId: request.userId,
                            appId: request.appId
                        }, (err, doc) => {
                            if (err) {
                                logger.error(err);
                            } else {
                                if (doc) {
                                    scopes.userApp = doc.service;
                                }
                                checkMappings(request, scopes, callback);
                            }
                        });
                    }
                });
            }
        });
    };

    function getGroupMapping(request, callback) {
        let scopes = {};
        groupModel.findOne({
            groupId: request.groupId
        }, (err, doc) => {
            if (err) {
                logger.error(err);
            } else {
                if (doc) {
                    scopes.group = doc.service;
                }
                checkMappings(request, scopes, callback);
            }
        });

    };

    function checkMappings(request, scopes, callback) {
        if (request.user) {
            if (scopes.user) {
                request.user = scopes.user;
            } else {
                request.user = createServiceID();
                usedIds.push(request.user);
                that.emit('newPath', request.user);
                createPathes(request.user);
                var newUserModel = new userModel();
                newUserModel.userId = request.userId;
                newUserModel.service = request.user;
                newUserModel.save();
            }
        }
        if (request.app) {
            if (scopes.app) {
                request.app = scopes.app;
            } else {
                request.app = createServiceID();
                usedIds.push(request.app);
                that.emit('newPath', request.app);
                createPathes(request.app);
                let newAppModel = new appModel();
                newAppModel.appId = request.appId;
                newAppModel.service = request.app;
                newAppModel.save();
            }
        }
        if (request.userApp) {
            if (scopes.userApp) {
                request.userApp = scopes.userApp;
            } else {
                request.userApp = createServiceID();
                usedIds.push(request.userApp);
                that.emit('newPath', request.userApp);
                createPathes(request.userApp);
                let newUserAppModel = new userAppModel();
                newUserAppModel.userId = request.userId;
                newUserAppModel.appId = request.appId;
                newUserAppModel.service = request.userApp;
                newUserAppModel.save();

            }
        }
        if (request.groupId) {
            if (scopes.group) {
                request.group = scopes.group;
            } else {
                request.group = createServiceID();
                usedIds.push(request.group);
                that.emit('newPath', request.group);
                createPathes(request.group);
                let newGroupModel = new groupModel();
                newGroupModel.groupId = request.groupId;
                newGroupModel.service = request.group;
                newGroupModel.save();
            }
        }

        callback(request);
    }


    function checkAllowed(path, data, callback) {
        let ids = {};
        userModel.findOne({
            service: path
        }, (err, doc) => {
            if (err) {
                logger.error(err);
            } else {
                if (doc) {
                    ids.user = doc.userId;
                }
                appModel.findOne({
                    service: path
                }, (err, doc) => {
                    if (err) {
                        logger.error(err);
                    } else {
                        if (doc) {
                            ids.app = doc.appId;
                        }
                        userAppModel.findOne({
                            service: path
                        }, (err, doc) => {
                            if (err) {
                                logger.error(err);
                            } else {
                                if (doc) {
                                    ids.userApp = doc.userId;
                                }
                                groupModel.findOne({
                                    service: path
                                }, (err, doc) => {
                                    if (err) {
                                        logger.error(err);
                                    } else {
                                        if (doc) {
                                            ids.group = doc.groupId;
                                        }
                                        if (ids.app || ids.group) {

                                            if (ids.group) {
                                                callback(true, true);
                                            } else {
                                                callback(true);
                                            }
                                        } else {
                                            if (ids.user) {
                                                if (ids.user === data.userId) {
                                                    callback(true);
                                                } else {
                                                    callback(false);
                                                }
                                            } else {
                                                if (ids.userApp) {
                                                    if (ids.userApp === data.userId) {
                                                        callback(true);
                                                    } else {
                                                        callback(false);
                                                    }
                                                } else {
                                                    callback(false);
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    function updateShow(name, show) {
        showAppModel.findOne({ name: name }, (err, docs) => {
            if (err || docs == null) {
                logger.info("no exist show, creating new");
                let newShowModel = new showAppModel();
                newShowModel.name = name;
                newShowModel.show = show;
                newShowModel.save();

            } else {
                logger.info(show, name, docs._id);
                docs.show = show;
                docs.save({ "_id": docs._id, "show": show }, (err) => logger.info(err));
                //showAppModel.findOneAndUpdate({ "name" : name },{ "$set":{ "show": show}});
            }
        });
    }
    function removeShow(name) {

        showAppModel.deleteOne({ name: name }, function (err) {
            if (err) logger.error(err);
            logger.info("Successful deletion", name);
        });
    }
    function getShows(cb) {
        let showIds = [];
        showAppModel.find({}, function (err, docs) {
            if (err) {
                logger.error(err);
                cb(err);
            } else {
                for (var i = 0, len = docs.length; i < len; i++) {
                    showIds.push(docs[i])
                }
            }
            cb(showIds);
        });

    }
    function createServiceID() {
        let found = true;
        let id;
        do {
            id = crypto.randomBytes(10).toString('hex');
            if (usedIds.indexOf(id) == -1) {
                found = false;
            }
        }
        while (found)
        return id;
    };


    function onChanged(path, doc) {
        var datagram = [{
            type: 'set',
            key: doc.key,
            value: doc.value
        }
        ];
        that.emit('changeState', path, datagram);
        datagram = undefined;
        doc = undefined;
    };

    function onRemoved(path, doc) {
        var datagram = [{
            type: 'remove',
            key: doc.key,
            value: null
        }
        ];
        that.emit('changeState', path, datagram);
        doc = null;
        datagram = null;

    };



    init();
    function getShortenModel() {

        return Url;
    }

    that = {

        getState: getState,
        changeState: changeState,
        getUserMapping: getUserMapping,
        getGroupMapping: getGroupMapping,
        checkAllowed: checkAllowed,
        getShortenModel: getShortenModel,
        getShows: getShows,
        updateShow: updateShow,
        removeShow: removeShow

    };

    that.__proto__ = EventEmitter.prototype;

    return that;
}

module.exports = MongoDB;
