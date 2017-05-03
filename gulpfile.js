var $ = require('gulp-load-plugins')(),
	gulp = require('gulp'),
	map = require('map-stream'),
	webpack = require('webpack-stream'),
	karma = require('gulp-karma'),
	jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish'),
	doc = require('gulp-jsdoc3');

var env = require('./config/env.js');

gulp.task('doc', function() {
    gulp.src(env.jsSrc)
        .pipe(doc({
        	opts: {
        		destination: './documentation'
        	}
        }));
});

gulp.task('demo', function() {
	return gulp.src(env.jsSrc)
		.pipe(webpack({
			entry: './'+env.demoConfig,
			module: {
				loaders: [{
					test: /\.js$/,
					loader: "babel-loader",
					query: {
	    				presets: ['es2015']
	  				}
				}],
			},
			output: {
				filename: 'demo.js'
			}
		}))
		.pipe(gulp.dest(env.demoDir));
});

gulp.task('library', function() {
	return gulp.src(env.jsDemo)
		.pipe(webpack({
			entry: './'+env.libraryConfig,
			module: {
				loaders: [{
					test: /\.js$/,
					loader: "babel-loader",
					query: {
	    				presets: ['es2015']
	  				}
				}],
			},
			output: {
				filename: env.name+'.js',
				library: env.library,
				libraryTarget: "var"
			},
			externals: env.externals
		}))
		.pipe(gulp.dest(env.distDir));
});

function test() {
	return gulp.src('aaa')
			.pipe(karma({
					configFile: env.karmaConfig,
					action: 'run'
			}))
			.on('error', function(err) {
					throw err;
			});
}

gulp.task('_test', test );

gulp.task('test', ['build'], test );

var failOnError = function() {
    return map(function(file, cb) {
        if (!file.jshint.success) {
            process.exit(1);
        }
        cb(null, file);
    });
};

gulp.task('build-lint', function() {
    gulp.src( env.jsSrc )
        .pipe( jshint() )
        .pipe( jshint.reporter(stylish) )
        .pipe( failOnError() );
});

gulp.task('lint', function() {
    gulp.src( env.jsSrc )
        .pipe( jshint() )
        .pipe( jshint.reporter(stylish) );
});

gulp.task('build', ['build-lint', 'demo','library'] );

gulp.task('watch', ['build'], function(){
	gulp.watch(env.jsSrc.concat(['./'+env.demoConfig]), ['lint', 'demo','library']);
});

gulp.task('serve', ['watch'], function() {
	gulp.src(env.demoDir)
		.pipe($.webserver({
			port: 9000,
			host: 'localhost',
			fallback: 'index.html',
			livereload: true,
			open: true
		}))
});