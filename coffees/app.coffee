
###
Module dependencies.
###
express = require("express")
ejs = require("ejs")
port = 3000
ioport = 3001
app = module.exports = express()

# Configuration
app.configure ->
  app.set "views", __dirname + "/views"
  app.set "view engine", "ejs"
  app.set "view options",
    layout: false

  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.static(__dirname + "/public")

app.configure "development", ->
  app.use express.errorHandler(
    dumpExceptions: true
    showStack: true
  )

app.configure "production", ->
  app.use express.errorHandler()


# Routes
app.get "/", (req, res) ->
  console.log "index"
  res.render "index",
    host: req.header("host").split(":")[0]
    ioport: ioport
    port: port


app.listen port
console.log "Express server listening on port %d in %s mode", port, app.settings.env
io = require("socket.io").listen(ioport)
io.sockets.on "connection", (socket) ->
  console.log "user connected"
  socket.on "disconnect", ->
    console.log "user disconnected."


exec = require("child_process").exec

# total memory
totalmem = require("os").totalmem() / 1024

# total swap
totalswp = 0
exec "cat /proc/meminfo | grep SwapTotal | sed -e s/[^0-9]//g", (err, stdout, stderr) ->
  totalswp = stdout.toString()


# start vmstat
proc = require("child_process").spawn("vmstat", ["1", "-n"])
proc.stdout.on "data", (data) ->
  try
    s = data.toString()
    return  if s[0] is "p"
    values = s.trim().split(/\s+/)
    stats =
      procs:
        r: values[0]
        b: values[1]

      memory:
        swpd: values[2]
        free: values[3]
        buff: values[4]
        cache: values[5]
        total: totalmem
        totalswp: totalswp

      swap:
        si: values[6]
        so: values[7]

      io:
        bi: values[8]
        bo: values[9]

      system:
        in_: values[10]
        cs: values[11]

      cpu:
        us: values[12]
        sy: values[13]
        id: values[14]
        wa: values[15]

    console.log stats, "stats"
    io.sockets.emit "stat", stats
  catch e
    console.error e
