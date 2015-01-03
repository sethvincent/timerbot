var os = require('os');
var path = require('path');
var test = require('tape');
var level = require('level');
var rimraf = require('rimraf');

var db, timer;
var dir = path.join(os.tmpdir(), 'timerbot');

test('setup', function (t) {
  db = level(dir);
  timer = require('./index')(db);
  t.end();
});

test('start a time block', function (t) {
  var start = { 
    title: 'doing some work', 
    project: 'timerbot' 
  };
  
  timer.start(start, function (err, block) {
    t.notOk(err);
    t.ok(block);
    t.end();
  });
});

test('stop a time block', function (t) {
  timer.stop(function (err, block) {
    t.notOk(err);
    t.ok(block);
    t.end();
  });
});

test('teardown', function (t) {
  rimraf(dir, function () {
    t.end();
  });
});