var gulp = require('gulp');
var through2 = require('through2');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');//http://www.browsersync.io/docs/gulp/
var reload = browserSync.reload;
var webpack = require("webpack");
require('date-utils');

//build version:
//script version
//style version
//manifest version
var startTime = 0;
var buildVersion = 0;
gulp.task('build_version', function (cb) {
  var startDate = new Date();
  startTime = startDate.getTime();
  buildVersion = startDate.toFormat('YYYYMMDDHHMISS');

  cb();
});

//watching script change to start default task
gulp.task('watch', function () {
  return gulp.watch([
    'gulpfile.js',
    './static/app/**/*.*'
  ], function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    runSequence('compile');
  });

});
gulp.task('dist:html', function () {
  return gulp.src(['./static/app/*.html'])
    //.pipe(cachebust.references())
    .pipe($.htmlmin({
      removeComments: true,
      minifyJS: true,
      minifyCSS: true
    }))
    .pipe(gulp.dest('./'));
});
//generate cache.manifest
gulp.task('manifest', function (cb) {
  var resources = [];
  gulp.src(['./resources/**/*.*','./src/**/*.js'])
    .pipe(through2.obj(function (file, enc, next) {
      this.push(file.path.replace(__dirname+'/',''));
      next();
    }))
    .on('data', function (data) {
      resources.push(data)
    })
    .on('end', function () {
      gulp.src(['./static/app/cache.manifest'])
        .pipe($.replace(/_BUILD_VERSION_/g, buildVersion))
        .pipe($.replace(/_FILES_/g, resources.join('\n')))
        .pipe(gulp.dest('./'))
        .on('end', function () {
          cb();
        });
    });
});
gulp.task("webpack", function(callback) {
  // run webpack
  webpack({
    entry: "./packall.js",
    output: {
      path: __dirname + "/src",
      filename: "App.js"
    },
    module: {
      loaders: [
        { test: /\.css$/, loader: "style!css?-url" }
      ]
    }
  }, function(err, stats) {
    if(err) throw new $.util.PluginError("webpack", err);
    $.util.log("[webpack]", stats.toString({
      // output options
    }));
    callback();
  });
});
//browser-sync serve
gulp.task('serve', function () {
  browserSync({
    "open": false,
    server:{
      dir: './'
    }
  });

  gulp.watch(['./*.html'], reload);
});

//print after tasks all done
gulp.task('_endlog', function (cb) {
  var endDate = new Date();
  var logs = [];
  logs.push('\nBuild version is ' + buildVersion);
  logs.push(', Completed in ' + ((endDate.getTime() - startTime) / 1000) + 's at ' + endDate + '\n');
  console.log(logs.join(''));
  cb();
});

gulp.task('prepare', function (cb) {
  runSequence('build_version', cb);
});
gulp.task('compile', function (cb) {
  runSequence(['prepare','manifest','dist:html'], cb);
});
gulp.task('default', function (cb) {
  runSequence('compile', 'watch', 'serve', cb);
});
