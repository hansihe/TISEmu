var gulp = require('gulp');
var config = require('../config');

gulp.task('production', ['webpack'], function() {
    config.setProduction();
});
