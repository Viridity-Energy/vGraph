'use strict';

var gulp = require( 'gulp' );
var map = require('map-stream');
var watch = require('gulp-watch');

// testing and linting
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var yuidoc = require('gulp-yuidoc');

// demo ability
var express = require( 'express' );
var open = require('gulp-open');
var server = express();

// less processing
var less = require( 'gulp-less' );
var concat = require( 'gulp-concat' );

// minify javascript
var uglify = require('gulp-uglifyjs');

// other settings
var jsSrc = [
        './src/init.js',
    	'./src/services/*.js',
    	'./src/directives/*.js'
    ],
    lessSrc = './style/*.less';

gulp.task( 'launch-server', function() {
    gulp.src('./bower_components/angular/angular.js')
        .pipe(gulp.dest('./demos/'));

    gulp.src('./bower_components/d3/d3.js')
        .pipe(gulp.dest('./demos/'));

    gulp.src('./bower_components/jquery/dist/jquery.js')
        .pipe(gulp.dest('./demos/'));

    server.use(express.static('./demos'));
    server.listen( 9000 );
});

gulp.task( 'watch', function(){
    gulp.watch( lessSrc, ['build-less'] );
    gulp.watch( jsSrc, ['build-js'] );
});

gulp.task( 'open-server', function(){
    var options = {
        url: "http://localhost:9000"
    };
    gulp.src("./index.html")
        .pipe(open("", options));
});

gulp.task( 'serve', ['watch', 'launch-server', 'open-server'] );

gulp.task('doc', function() {
    gulp.src( jsSrc )
        .pipe( yuidoc() )
        .pipe( gulp.dest('./doc') );
});

gulp.task( 'concat-less', function(){
    gulp.src( lessSrc )
		.pipe( concat('vgraph.less') )
		.pipe( gulp.dest('./build/') );
});

gulp.task( 'build-less', ['concat-less'], function (){
    gulp.src( './build/vgraph.less' )
    	.pipe( less() )
    	.pipe( gulp.dest('./build/') )
        .pipe( gulp.dest('./demos/') );
});

gulp.task('concat-js', function() {
    gulp.src( jsSrc )
        .pipe( concat('vgraph.js') )
        .pipe( gulp.dest('./build/') )
        .pipe( gulp.dest('./demos/') );
});

gulp.task('build-js', ['concat-js'], function(){
    gulp.src( jsSrc )
        .pipe( uglify('vgraph.min.js', {
            outSourceMap: true
        }) )
        .pipe( gulp.dest('./build/') )
        .pipe( gulp.dest('./demos/') );
});

var failOnError = function() {
    return map(function(file, cb) {
        if (!file.jshint.success) {
            process.exit(1);
        }
        cb(null, file);
    });
};

gulp.task('build-lint', function() {
    gulp.src( jsSrc )
        .pipe( jshint() )
        .pipe( jshint.reporter(stylish) )
        .pipe( failOnError() );
});

gulp.task('lint', function() {
    gulp.src( jsSrc )
        .pipe( jshint() )
        .pipe( jshint.reporter(stylish) );
});

gulp.task( 'build', ['build-lint','build-js','build-less'] );

gulp.task( 'build-serve', ['build','serve'] );

gulp.task( 'build-watch', ['build','watch'] );