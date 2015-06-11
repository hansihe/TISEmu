var express = require('express');
var http = require('http');
var path = require('path');

exports.makeServer = function(config) {
    var app = express();
    var httpServer = http.Server(app);

    app.use('/static', express.static('./build/www'));

    app.get('/', function(req, res, next) {
        res.sendFile(path.resolve(__dirname + '../../../www/index.html'));
    });

    return httpServer;
};
