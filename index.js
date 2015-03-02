var sub = require('subleveldown');
var indexer = require('level-indexer');
var through = require('through2');
var moment = require('moment');
var cuid = require('cuid');
var each = require('each-async');

module.exports = Timer;

function Timer (db, opts) {
  if (!(this instanceof Timer)) return new Timer(db, opts);
  opts = opts || {};
  this.db = db;
  this.times = sub(db, 'times', { valueEncoding: 'json' });
  this.indexesDB = sub(db, 'indexes');
  this.index = indexer(this.indexesDB, ['person']);
  this.minimum = opts.minimum || 15;
}

Timer.prototype.get = function (person, cb) {
  var self = this;

  this.index.findOne(person, function (err, key) {
    if (err) return cb(err);
    if (!key) return cb({ error: 'no time blocks found' });
    self.times.get(key, null, cb);
  });
}

Timer.prototype.put = function (block, cb) {
  var self = this;
  
  this.times.put(block.key, block, function (err) {
    if (err) return cb(err);
    
    self.index.add(block, block.key, function () {
      self.times.get(block.key, null, cb);
    });
  });
}

Timer.prototype.add = function (block, cb) {
  var newBlock = createBlock(block);

  self.put(newBlock, function (err) {
    if (err) return cb(err);
    self.get(newBlock.person, cb);
  });
}

Timer.prototype.start = function (block, cb) {
  var self = this;

  this.active(block.person, function (err, status) {
    if (status.active) return cb(status);
    var newBlock = createBlock(block);

    self.put(newBlock, function (err) {
      if (err) return cb(err);
      self.get(newBlock.person, cb);
    });
  });
}

Timer.prototype.stop = function (person, cb) {
  var self = this;

  this.active(person, function (err, status) {
    if (status.active === false) {
      return cb({ error: 'You do not currently have an open time block' });
    }
    
    var block = status.block;
    block.active = false;
    block.end = timestamp(this.minimum);
    block.hours = hours(block.start, block.end, self.minimum);
    
    self.times.put(block.key, block, function (err) {
      if (err) return cb(err);
      cb(null, block);
    })
  });
}

Timer.prototype.active = function (person, cb) {
  var self = this;
  var activeBlock;
  var stream = this.index.find(person);

  stream.pipe(through(each, end));

  function each (key, enc, next) {
    self.times.get(key, null, function (err, block) {
      if (block.active) activeBlock = block;
      next();
    });
  }

  function end () {
    if (!activeBlock) return cb(null, { active: false });
    cb(null, {
      active: true,
      message: 'You already have an active time block: ' + activeBlock.title,
      block: activeBlock
    });
  }
}

Timer.prototype.list = function (person, cb) {
  var stream = this.index.find(person);
  var self = this;
  var data = [];

  stream.pipe(through(each, end));

  function each (key, enc, next) {
    self.times.get(key.toString(), null, function (err, block) {
      data.push(block);
      next();
    });
  }

  function end () {
    cb(null, data)
  }
}

Timer.prototype.total = function (person, project, cb) {
  this.list(person, function (err, list) {
    var total = 0;
    each(list, iterator, end);

    function iterator (item, i, done) {
      total += item.hours;
      done();
    }

    function end() {
      cb(total);
    }
  });
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

function timestamp (time) {
  var t = time ? moment(time) : moment();
  return { human: t.format('h:mm a, MMM DD, YYYY'), unix: t.unix() };
}

function hours (start, end, minimum) {
  var startdur = moment.duration(start.unix);
  var enddur = moment.duration(end.unix);
  var duration = enddur.subtract(startdur)
  if (duration.minutes() < minimum) return minimum / 60;
  return duration.minutes() / 60;
}