var dest = "./build";
var wwwDest = dest + "/www";
var src = "./src";
var webpack = require('webpack');

var config = {
    server: {
        port: 8080,
        staticLocation: wwwDest,
        defaultFile: 'index.html'
    },
    frontServer: {
        directory: wwwDest
    },
    sass: {
        src: src + "/client/sass/**.scss",
        dest: wwwDest,
        errLogToConsole: true,
        includePaths: [dest],
        style_scan_path: src + "/client",
        style_temp: dest
    },
    webpack: {
        src: dest + "/js/",
        dest: wwwDest,
        debug: true,
        devtool: '#source-map',
        entry: {
            main: './build/js/client/main.js'
        },
        output: {
            filename: './main.js'
        },
        plugins: [
        ]
    },
    transform: {
        src: src + "/**/*.js",
        dest: dest + "/js",
        config: {
            optional: ["runtime", "es7.asyncFunctions"]
            //optional: ["es7.asyncFunctions"]
        }
    },
    markup: {
        src: src + "/client/html/*.html",
        dest: wwwDest
    }
};

module.exports = config;
