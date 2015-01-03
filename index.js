var mkdirp = require('mkdirp');
var sub = require('subleveldown');
var indexer = require('level-indexer');
var moment = require('moment');
var cuid = require('cuid');

module.exports = Timer;

function Timer (db, opts) {
  if (!(this instanceof Timer)) return new Timer(db, opts);
  opts = opts || {};
  this.db = db;
  this.times = sub(db, 'times', { valueEncoding: 'json' });
  this.index = indexer(db, ['person']);
  this.minimum = opts.minimum || 15;
}

Timer.prototype.get = function (block, cb) {
  var self = this;
  var opts = [block.person];
  this.index.findOne(opts, function (err, key) {
    if (err) return cb(err);
    console.log(err, key)
    self.times.get(key, null, cb);
  });
}

Timer.prototype.put = function (block, cb) {
  var self = this;
  
  this.times.put(block.key, block, function (err) {
    if (err) return cb(err);
    
    self.index.add(block, block.key, function () {
      self.get(block, cb);
    });
  });
}

Timer.prototype.start = function (block, cb) {
  var self = this;
  
  this.active(function (err, status) {
    if (status.active) return cb(status);
    var newBlock = createBlock(block);
    
    self.put(newBlock, function (err) {
      if (err) return cb(err);
      self.get(newBlock, cb);
    });
  });
}

Timer.prototype.stop = function (block, cb) {
  var self = this;

  if (block && block.key) return stopBlock(block, cb);
  if (typeof block === 'function') cb = block;

  this.active(function (err, status) {
    if (status.active === false) return cb({ error: 'You do not currently have an open time block' });
    return stopBlock(status.block, cb);
  });

  function stopBlock (opts, cb) {
    opts.end = timestamp(this.minimum);
    opts.hours = hours(opts.start, opts.end, self.minimum);
    self.times.put(opts.key, opts, function (err) {
      if (err) return cb(err);
      cb(null, opts);
    })
  }
}

Timer.prototype.active = function (cb) {
  var activeBlock;

  this.times.createReadStream({ keys: false })
    .on('data', function (block) {
      if (block.active) activeBlock = block;
    })
    .on('error', function (err) { return cb(err); })
    .on('end', function () {
      var msg = {};
      if (activeBlock) {
        msg.active = true;
        msg.message = 'You already have an active time block: ' 
          + activeBlock.title;
        msg.block = activeBlock;
      }
      else {
        msg.active = false;
      }
      cb(null, msg); 
    });
}

Timer.prototype.list = function (opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  
  opts.keys = opts.keys || false;
  var stream = this.index.find([opts.person, opts.active, opts.project]);
  if (!cb) return stream;
  
  var data = [];
  
  stream.on('data', function (block) {
    data.push(block);
  });
  
  stream.on('error', function (err) {
    cb(err);
  });
  
  stream.on('end', function () {
    cb(null, data);
  });
}

Timer.prototype.data = function (opts, cb) {
  this.list(opts, cb);
}

Timer.prototype.add = function (opts, cb) {
  
}

function createBlock (doc) {
  return {
    key: doc.key || cuid(),
    start: doc.start || timestamp(),
    end: doc.end || null,
    active: doc.active || true,
    title: doc.title || null,
    project: doc.project || null,
    person: doc.person || null,
    hours: doc.hours || null,
    notes: doc.notes || [],
    meta: doc.meta || {}
  }
}

function timestamp (minimum) {
  var now = moment();
  return { human: now.format('h:mm a, MMM DD, YYYY'), unix: now.unix() };
}

function hours (start, end, minimum) {
  var startdur = moment.duration(start.unix);
  var enddur = moment.duration(end.unix);
  var duration = enddur.subtract(startdur)
  if (duration.minutes() < minimum) return minimum / 60;
  return duration.minutes() / 60;
}