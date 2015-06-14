var express = require('express');
var bodyParser = require('body-parser')
var http = require('http');
var path = require('path');

var bases = require('bases');
var crypto = require('crypto');

// https://gist.github.com/aseemk/3095925
// Returns a base-62 (alphanumeric only) string of the given length:
function randomStr(length) {
    // We generate a random number in a space at least as big as 62^length,
    // and if it's too big, we just retry. This is still statistically O(1)
    // since repeated probabilities less than one converge to zero. Hat-tip to
    // a Google interview for teaching me this technique! ;)

    // The native randomBytes() returns an array of bytes, each of which is
    // effectively a base-256 integer. We derive the number of bytes to
    // generate based on that, but note that it can overflow after ~150:
    var maxNum = Math.pow(62, length);
    var numBytes = Math.ceil(Math.log(maxNum) / Math.log(256));
    if (numBytes === Infinity) {
        throw new Error('Length too large; caused overflow: ' + length);
    }

    do {
        var bytes = crypto.randomBytes(numBytes);
        var num = 0
            for (var i = 0; i < bytes.length; i++) {
                num += Math.pow(256, i) * bytes[i];
            }
    } while (num >= maxNum);

    return bases.toBase62(num);
}

exports.makeServer = function(config) {
    var app = express();
    var httpServer = http.Server(app);
    var apiRouter = express.Router();

    var thinky = require('thinky')();
    var type = thinky.type;

    var Program = thinky.createModel('Program', {
        id: type.string().default(() => randomStr(6)),
        created: type.date().default(() => new Date()),
        source: type.object().required()
    });

    async function addProgram(source) {
        for (var i = 0; i < 10; i++) {
            try {
                return await new Program({
                    source: source
                }).save();
            } catch (e) {
                if (i === 9) throw e;
            }
        }
    }

    apiRouter.route('/Program')
        .post((req, res) => {
            addProgram(req.body)
                .then(result => {
                    res.json({
                        success: true,
                        program: result
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.status(400).json({
                        success: false, 
                        error: err
                    });
                });
        });

    apiRouter.route('/Program/:program_id')
        .get((req, res) => {
            var programId = req.params.program_id;
            Program.get(programId).run()
                .then(result => {
                    res.json({
                        success: true,
                        program: result
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.status(400).json({
                        success: false,
                        error: err
                    });
                });
        });

    app.use(bodyParser.json());
    app.use('/api', apiRouter);
    app.use('/static', express.static('./build/www'));
    app.get('/', function(req, res, next) {
        res.sendFile(path.resolve(__dirname + '../../../www/index.html'));
    });

    return httpServer;
};
