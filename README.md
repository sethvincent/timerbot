# timerbot

> A JavaScript API for tracking time.

Because most time tracking software doesn't have the things that I want (JSON API, use as JS library, **&** open source).

Because there are a few project ideas I'm working on where tracking time may be part of the app, so a library would be useful.

Because this is how I spent a Friday evening.

Next: create a timerbot-server package with a JSON API.

## Install

```
npm install --save timerbot
```

## Usage

Requires using with a [levelup](https://github.com/rvagg/node-levelup) instance like so:

```
var level = require('level');
var db = level('/tmp/timerweeee');
var timer = require('timerbot')(db);
```

### timer.start(options, callback)

```
var start = { 
  title: 'doing some work', 
  project: 'timerbot',
  person: 'robodog'
};

timer.start(start, function (err, block) {
  console.log(err, block)
});
```

### timer.stop(person, callback)

```
timer.stop('robodog', function (err, block) {
  console.log(err, block);
});
```

### timer.active(person, callback)

```
timer.active('robodog', function (err, status) {
  console.log(err, status);
});
```

### timer.list(person, callback)

```
timer.list('robodog', function (err, data) {
  console.log(err, data);
});
```

## Contributing

See the [CONTRIBUTING.md file](https://github.com/sethvincent/timerbot/blob/master/CONTRIBUTING.md).

## License

[MIT](https://github.com/sethvincent/timerbot/blob/master/LICENSE.md)