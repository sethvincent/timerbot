var level = require('level');
var db = level('/tmp/timerweeee');
var timer = require('../index')(db);

timer.active('seth', function (err, block) {
  console.log(err, block);
});

