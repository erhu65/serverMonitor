
/**
 * Module dependencies.
 */
var express = require('express');
var ejs = require('ejs');
var port = 3000, ioport = 3001;
var app = module.exports = express();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('view options', {layout: false});
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res){
  console.log("index");
  res.render('index', {
    host: req.header('host').split(":")[0],
	ioport: ioport,
	port: port,
  });
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);



var io = require("socket.io").listen(ioport);
io.sockets.on('connection', function(socket) {

	console.log('user connected');

	socket.on('disconnect', function(){
		console.log('user disconnected.');
	});
});


var exec = require('child_process').exec

// total memory
var totalmem = require('os').totalmem() / 1024;

// total swap
var totalswp = 0;
exec('cat /proc/meminfo | grep SwapTotal | sed -e s/[^0-9]//g', function(err, stdout, stderr) {
  totalswp = stdout.toString();
});


// start vmstat
var proc = require('child_process').spawn('vmstat', ['1', '-n']);

proc.stdout.on('data', function(data){
  try {
  var s = data.toString();

  if (s[0] === 'p')  {
	return;
  }

  var values = s.trim().split(/\s+/);
  var stats = {
	procs:{r:values[0], b:values[1]},
	memory:{swpd:values[2], free:values[3], buff:values[4], cache:values[5], total:totalmem, totalswp:totalswp},
	swap:{si:values[6], so:values[7]},
	io:{bi:values[8], bo:values[9]},
	system:{in_:values[10], cs:values[11]},
	cpu:{us:values[12], sy:values[13], id:values[14], wa:values[15]}
  };
  console.log(stats, 'stats');
  io.sockets.emit('stat', stats);
  } catch (e) {
	console.error(e);
  }
});
