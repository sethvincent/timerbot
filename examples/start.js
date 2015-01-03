var level = require('level');
var db = level('/tmp/timerweeee');
var timer = require('../index')(db);

var start = { 
  title: 'doing some work', 
  project: 'timerbot' 
};

timer.start(start, function (err, block) {
  if (err) console.log(err);
  else console.log(err, block)
});

//db.createReadStream().on('data', console.log)