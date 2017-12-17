"use strict";

try {
	process.setuid('xtompc');
} catch(err) {
	console.log("setuid xtompc failed");
	if (err.code === 'EPERM') {
		console.log("for setuid xtompc, run as root");
	}
}

const sys  = require("util");
const http = require("http");
const WebSocket = require('ws');
const FilterChain = require("filter-chain").FilterChain;

/**
 * Main application entry point.
 */
require('./status-socket.js');
const config = require("./config.js").config;
const nginStatsMonitor = require('./ngin-stats-monitor.js');
const nginInfo = require('./ngin-info.js');

const attributesFilter = 	require("./attributes-filter.js"),
	logRequestFilter = 	require("./log-request-filter.js"),
	serverHeaderFilter = require("./server-header-filter.js"),
	routerFilter = 		require("./router.js");


const chainModules = [
	attributesFilter, 
//	logRequestFilter, 
	serverHeaderFilter,
	routerFilter
];


const chain = new FilterChain(chainModules);
var server;
var wss;

const startHttpServer = function() {
	/**
	 * Contains the main loop and error handling for the server.
	 * 
	 * router.js directs requests to the correct module.
	 * 
	 */
	server = http.createServer(function(request, response) {
		try {
			chain.execute(request, response);
		}
		catch(err) {
			console.log("xtomp-console: [error] unhandled error in req/resp handling:" + err);
		}
	
		}).listen(parseInt(config.port), '127.0.0.1');
	
	console.log("xtomp-console: [info] listening http://localhost:" + config.port);

	wss = new WebSocket.Server({ server });

	wss.on('connection', (ws, req) => {
		if (config.debug) console.log("xtomp-console: [debug] ws connect");
	});
	exports.broadcast = function(data) {
		let json = JSON.stringify(data);
		// console.log("broadcast: " + json);
		wss.clients.forEach( (client) => {
			if (client.readyState === WebSocket.OPEN) client.send(json);
		});
	};
};

process.on('uncaughtException', function (err) {
	console.log("xtomp-console: [error] " + err);
});

process.on('SIGINT', function() {
	nginStatsMonitor.disconnect();
	server.close();
	console.log("xtomp-console: [error] abort");
	// TODO wftnode
	process.exit(0);
});

/**
 * Here we go
 */
nginInfo.init();
startHttpServer();

