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
var demoDir = './demos/',
    jsSrc = [
        './src/init.js',
    	'./src/services/*.js',
    	'./src/directives/*.js',
        './src/polyfill/*.js'
    ],
    externals = [
    ],
    lessSrc = './style/*.less';

gulp.task( 'launch-server', function() {
    externals.forEach(function( src ){
        gulp.src( src ).pipe( gulp.dest(demoDir) );
    });

    server.use(express.static(demoDir));
    server.listen( 9000 );
});

gulp.task( 'watch', function(){
    gulp.watch( lessSrc, ['build-less'] );
    gulp.watch( jsSrc, ['build-js'] );
});

gulp.task( 'serve', ['build-js', 'build-less', 'watch', 'launch-server'] );

gulp.task('doc', function() {
    gulp.src( jsSrc )
        .pipe( yuidoc() )
        .pipe( gulp.dest('./doc') );
});

gulp.task( 'concat-less', function(){
    console.log( lessSrc );
    gulp.src( lessSrc )
		.pipe( concat('vgraph.less') )
		.pipe( gulp.dest('./build/') );
});

gulp.task( 'build-less', ['concat-less'], function (){
    console.log( 'building less' );
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