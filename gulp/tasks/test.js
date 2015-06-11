var gulp = require('gulp');
var mocha = require('gulp-mocha');
var config = require('../config');

gulp.task('test', ['transforms'], function() {
    //return gulp.src(config.test.src).pipe(jest(config.test.options));
    return gulp.src(config.test.src, {read: false}).pipe(mocha(config.test.options));
});
