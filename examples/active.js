var level = require('level');
var db = level('/tmp/timerweeee');
var timer = require('../index')(db);

timer.active(function (err, chunk) {
  console.log(chunk);
});

