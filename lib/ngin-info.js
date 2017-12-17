"use strict";

const fs = require('fs');

const parse = require('xtomp-conf-parser').parse;
const nginStatsMonitor = require('./ngin-stats-monitor.js');
const server = require('./xtomp-console.js');
const config = require('./config.js').config;

var xtompConfFile = "/etc/xtomp.conf";
var xtompConfig;


const nginInfo = {
	proc : {},
	sock : {},
	cc : null
};

const privateConfigInfo = {
	loginRequired : false,
	shaAuthRequired : false,
	login : "",
	passcode : "",
	secret : ""
};

const publicConfigInfo = {
	listen : 0,
	timeout : 0,
	websockets : false,
	destinations : []
};

const destinationInfo = [];


// TODO error handling
const initProcessInfo = function() {
	if ( xtompConfig.pid ) {
		/**
		 * Read the process id
		 */
		let processId = "" + fs.readFileSync(xtompConfig.pid);
		//console.log("ngin pid: " + processId);
		nginInfo.pid = processId.trim();
		
		let proc = "/proc/" + nginInfo.pid;
		
		/**
		 * Process info inc memory statistics of master process
		 * TODO child process
		 */
		nginInfo.proc = {};
		nginInfo.cmdline = "" + fs.readFileSync(proc + "/cmdline");
		let status = "" + fs.readFileSync(proc + "/status");
		let statusInfo = status.split('\n');
		statusInfo.forEach( (line) => {
			if ( line.startsWith("Vm") ) {
				let keyVal = line.split(':');
				nginInfo.proc[keyVal[0]] = keyVal[1].trim();
			}
		});
		
		/**
		 * Socket statistics
		 */
		nginInfo.sock = {};
		let sockstat = "" + fs.readFileSync(proc + "/net/sockstat");
		let sockstatInfo = sockstat.split('\n');
		sockstatInfo.forEach( (line) => {
			let keyVal = line.split(':');
			if (keyVal[0] === 'sockets') nginInfo.sock.sockets = keyVal[1].trim();
			if (keyVal[0] === 'TCP') nginInfo.sock.tcp = keyVal[1].trim();
		});
	}
};

const initConfigInfo = function() {
	let server = xtompConfig.xtomp.servers[0];
	privateConfigInfo.loginRequired = typeof server.login === 'string';
	privateConfigInfo.shaAuthRequired = typeof server.secret === 'string';
	privateConfigInfo.login = server.login;
	privateConfigInfo.passcode = server.passcode;
	privateConfigInfo.secret = server.secret;
	privateConfigInfo.listen = server.listen;
	nginStatsMonitor.init(privateConfigInfo);
	
	publicConfigInfo.listen = server.listen;
	publicConfigInfo.timeout = server.timeout;
	publicConfigInfo.websockets = server.websockets;
	publicConfigInfo.destinations = server.destinations;
	
};

exports.init = function() {

	parse(xtompConfFile, (err, xtompConf) => {
		if (err) throw err;

		xtompConfig = xtompConf;
		if ( xtompConfig.worker_processes !== 1) {
			throw Error(xtompConfFile + ": expected  worker_processes 1;" );
		}
		if ( xtompConfig.pid ) {
			initProcessInfo();
		}
		if ( xtompConfig.xtomp.servers.length !== 1 ) {
			throw Error(xtompConfFile + ": expected 1, and only 1, server config" );
		}
		else {
			initConfigInfo();
		}
//		console.log(privateConfigInfo);
//		console.log(publicConfigInfo);
//		console.log(nginInfo);
	});
};

exports.setStats = function(stats) {
	try {
		server.broadcast(stats);
	} catch (err) {
		console.dir(err);
	}
	if ( stats.cc ) {
		nginInfo.cc = stats.cc;
		nginInfo.cc.lastmod = new Date().getTime();
		if (config.debug) console.log("xtomp-console: [debug] " + new Date().toISOString() + " tick" );
		// console.log("server cc: " + JSON.stringify(nginInfo))
	}
	else if ( stats.dest ) {
		let destination = stats.dest;
		delete stats.dest;
		destinationInfo[destination] = stats;
	}
	else if ( stats.proc ) {
		nginInfo.proc = stats.proc;
		nginInfo.cc.lastmod = new Date().getTime();
	}
};

exports.getDestinationInfo = function(destination) {
	return destinationInfo[destination];
};

exports.getConfig = function() {
	return publicConfigInfo;
};

exports.getServerInfo = function() {
	return nginInfo;
};
