var level = require('level');
var db = level('/tmp/timerweeee');
var timer = require('../index')(db);

var opts = { 
  person: 'seth'
};

timer.get(opts, function (err, block) {
  if (err) console.log(err);
  else console.log(err, block)
});
  
