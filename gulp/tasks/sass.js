var gulp = require('gulp');
var glob = require('glob');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
var sass = require('gulp-sass');
var config = require('../config').sass;

var open_tag = "/*scss*"
var close_tag = "*scss*/"

function harvest_inline_styles(cb) {
    glob(config.style_scan_path + "/**/*.js", {}, function(err, files) {
        async.map(files, function(file_name, callback) {
            fs.readFile(file_name, 'utf8', function(err, data) {
                var file_comment = "/* " + file_name + " */";
                if (err) {callback(err, file_comment + "/* error */")}
                else if (data.indexOf(open_tag) === -1) {callback(null, file_comment + "/* empty */")}
                else {
                    var res = _.reduce(data.substr(data.indexOf(open_tag) + open_tag.length).split(open_tag), function(acc, item) {
                        return acc + item.substr(0, item.indexOf(close_tag));
                    }, "");
                    callback(err, file_comment + res);
                }
            });
        }, function(err, results) {
            var res = _.reduce(results, function(result, item) {
                return result + "\n\n" + item;
            }, "");
            cb(res);
        });
    });
};

gulp.task('sass', function() {
    harvest_inline_styles(function(data) {
        fs.writeFile(config.style_temp + '/_inline_styles.scss', data);
    });
    //config.importer = function(url, prev, done) {
        //if (url === "_inline_styles_") {
            //console.log(done.toString());
        //} else {
            //done({file: url});
        //}
        //return undefined;
    //};
    return gulp.src(config.src)
        .pipe(sass(config))
        .pipe(gulp.dest(config.dest))
});
