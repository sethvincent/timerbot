var level = require('level');
var db = level('/tmp/timerweeee');
var timer = require('../index')(db);

timer.stop(function (err, block) {
  if (err) console.log(err);
  else console.log(block)
});
  
