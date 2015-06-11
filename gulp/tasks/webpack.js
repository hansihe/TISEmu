var gulp = require('gulp');
//var browserify = require('gulp-browserify');
var gulp_webpack = require('gulp-webpack');
var webpack = require('webpack');
var config = require('../config').webpack;

gulp.task('webpack', ['markup', 'sass', 'transforms'], function() {
    gulp.src(config.src)
        //.pipe(browserify({
        //    transform: config.transform,
        //    insertGlobals: true,
        //    debug: config.debug
        //}))
        .pipe(gulp_webpack(config))
        .pipe(gulp.dest(config.dest))
});
