var gulp = require('gulp');

var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('default', ['compress']);

// Lint Task
gulp.task('lint', function() {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('jss.js')
        .pipe(uglify())
				.pipe(rename('jss.min.js'))
        .pipe(gulp.dest('.'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('jss.js', ['lint', 'scripts']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'watch']);
