var level = require('level');
var db = level('/tmp/timerweeee');
var timer = require('../index')(db);

timer.list('seth', function (err, data) {
  console.log(err, data);
});