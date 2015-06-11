var gulp = require('gulp');
var sourceMaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var config = require('../config');

gulp.task('transforms', function() {
    return gulp.src(config.transform.src)
        .pipe(sourceMaps.init())
        .pipe(babel(config.transform.config))
        .pipe(sourceMaps.write('./'))
        .pipe(gulp.dest(config.transform.dest));
});
