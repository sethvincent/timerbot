var level = require('level');
var db = level('/tmp/timerweeee');
var timer = require('../index')(db);

timer.stop('seth', function (err, block) {
  if (err) console.log(err);
  else console.log(block)
});
  
