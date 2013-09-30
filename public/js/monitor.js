var socket = null;
var port = 3001;

$(function(){

  var options = [
	{strokeStyle:'#393', lineWidth:1, fillStyle:'#363'},
	{strokeStyle:'#933', lineWidth:1, fillStyle:'#633'},
	{strokeStyle:'#993', lineWidth:1, fillStyle:'#663'},
	{strokeStyle:'#339', lineWidth:1, fillStyle:'#336'}
  ];

  var charts = {cpu: 4, memory: 3, procs: 2, io: 2, system: 2, swap: 2};
  var monitor = {};

  for (var k in charts) {
	var count = charts[k];
	monitor[k] = {};
	monitor[k].chart = new SmoothieChart({maxValue:100, minValue:0,
		grid:{fillStyle:'#000', strokeStyle:'#555', lineWidth:1, millisPerLine:1000, verticalSections:4}});
	monitor[k].chart.streamTo(document.getElementById(k));
	monitor[k].series = [];
	for (var i = 0; i < count; i++) {
	  var ts = new TimeSeries();
	  monitor[k].chart.addTimeSeries(ts, options[i]);
	  monitor[k].series.push(ts);
	}
  }


  socket = io.connect("http://" + location.hostname + ":" + port);

  socket.on('stat', function(d){
	var now = new Date().getTime();

	// cpu
	var total = 100 - d.cpu.id;
	monitor.cpu.series[0].append(now, total);
	monitor.cpu.series[1].append(now, d.cpu.us);
	monitor.cpu.series[2].append(now, d.cpu.sy);
	monitor.cpu.series[3].append(now, d.cpu.wa);

	// mem
	var used = d.memory.total - d.memory.free - d.memory.cache;
	monitor.memory.series[0].append(now, used / d.memory.total * 100);
	monitor.memory.series[1].append(now, d.memory.swpd / d.memory.totalswp * 100);

	// procs
	monitor.procs.series[0].append(now, d.procs.r);
	monitor.procs.series[1].append(now, d.procs.b);

	// io
	monitor.io.series[0].append(now, d.io.bo);
	monitor.io.series[1].append(now, d.io.bi);

	// system
	monitor.system.series[0].append(now, d.system.cs);
	monitor.system.series[1].append(now, d.system.in);

	// swap
	monitor.swap.series[0].append(now, d.swap.si);
	monitor.swap.series[1].append(now, d.swap.so);

	// status messases
	for (var k in d) {
	  var t = [];
	  for (var j in d[k]) {
		var n = j.replace(/(^_+)|(_+$)/g, "");
		t.push(n + ":" + d[k][j]);
	  }
	  $("#" + k + "-stat").html(t.join(", "));
	}

  });
});
