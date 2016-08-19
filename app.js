/**
 * CrazyMeet application
 * @author Ilez Kurskiev
 * @connection crazy.leo.dev@gmail.com
**/

var clusterize = require("./lib/cluster")
var debug = require("./lib/debug")(2)
var http = require("http")
var express = require("express")
var app = express()
var server = http.createServer(app)
var socket = require("./lib/socket")

// Setters
app.set("debug", debug)
app.set("view engine", "html")
app.set("views", "./templates")
app.set("port", 3000)
app.set("host", "0.0.0.0")
app.set("mongoUrl", "mongodb://localhost:27017/leo")
app.set("month", 1000 * 60 * 60 * 24 * 31)
app.set("week", 1000 * 60 * 60 * 24 * 7)
app.set("staticServer", [
	"http://localhost:" + app.get("port")
])

// Start
clusterize({
	enable: false,
	debug: debug,
	mongoUrl: app.get("mongoUrl")
}, function (cluster, mongodb) {
	// Middlewares
	var methodOverride = require("method-override")
	var cookieParser = require("cookie-parser")
	var bodyParser = require("body-parser")
	var session = require("express-session")
	var favicon = require("serve-favicon")
	var mongoStore = require("connect-mongo/es5")(session)
	var swig = require("swig")
	var swig = new swig.Swig({
		tagControls: ["{*", "*}"]
	})

	// Setters
	app.engine("html", swig.renderFile)
	app.set("mongodb", mongodb)

	// Use
	app.use(favicon("./favicon.ico"))
	app.use(express.static("./static", {
		maxAge: 0 // app.get("month")
	}))
	app.use(bodyParser.urlencoded({
		extended: true
	}))
	app.use(bodyParser.json())
	app.use(methodOverride())
	app.use(cookieParser())
	app.use(session({
		name: "leo.sid",
		secret: "crazy.leo.dev",
		cookie: {
			maxAge: app.get("week"),
			httpOnly: false
		},
		store: new mongoStore({
			url: app.get("mongoUrl"),
			collection: "sessions"
		}),
		resave: false,
		saveUninitialized: true,
	}))

	// Router
	require("./scripts/router")(app)

	// 404
	app.use(function (req, res) {
		res.status(404).sendFile(__dirname + "/templates/404.html")
	})

	// Listen Server
	server.listen(app.get("port"), app.get("host"), function () {
		debug.info(
			"Server listening on the host: %s:%s, by process [%s]", 
			app.get("host"),
			app.get("port"),
			process.pid
		)
	})
})