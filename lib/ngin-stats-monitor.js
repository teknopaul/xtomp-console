"use strict";

const crypto = require('crypto');
const EventEmitter = require('events').EventEmitter;
const stomp = require('stomp-js');

const xtompReconnect = require('./xtomp-reconnect.js');
const nginInfo = require('./ngin-info.js');
const config = require('./config.js').config;

var client;

// TODO should be

class NginMonitor extends EventEmitter {
	constructor() {
		super();
	}
}

exports.init = function(privateConfigInfo) {
	
	let stompArgs = {
		port: config.stompPort,
		host: 'localhost',
		'heart-beat': '120000,120000'
	};
	
	// prefer standards ports
	if ( privateConfigInfo.listen.indexOf(config.stompPort) != -1 ) {
		stompArgs.port = config.stompPort;
	}
	else {
		stompArgs.port = privateConfigInfo.listen[0];
	}
	if (config.debug) console.log("xtomp-console: [debug] stats connect: " + stompArgs.port + " of [" + privateConfigInfo.listen + "]");

	if ( privateConfigInfo.loginRequired ) {
		stompArgs.login = privateConfigInfo.login;
		stompArgs.passcode = privateConfigInfo.passcode;
	}
	
	if ( privateConfigInfo.shaAuthRequired ) {
		stompArgs.login = "admin " + Math.floor(new Date().getTime() / 1000) + " " + (Math.random() * 1000000).toString(32);
		let hash = crypto.createHash('sha1');
		hash.update(stompArgs.login + privateConfigInfo.secret);
		stompArgs.passcode = hash.digest('base64');
	}
	
	client = new stomp.Stomp(stompArgs);
	// TODO auth

	client.on('connected', function() {
		console.log('xtomp-console: [info] stats connected');
		client.subscribe({
			destination: '/xtomp/stat',
			receipt : 'sub'
		});
	});

	client.on('receipt', function(id) {
		if ( id === 'sub' ) {
			if (config.debug) console.log('xtomp-console: [debug] stats subscribed');
		}
		//if ( id === 'sub' ) emit('subscribed');
	});

	client.on('message', function(message) {
		let stats = JSON.parse(message.body);
		//emit('stats', stats);
		//console.log(stats);
		nginInfo.setStats(stats);
	});

	client.on('error', function(error_frame) {
		if (error_frame.headers.message === 'destination unknown') {
			console.log('xtomp-console: [error] enable /xtomp/stats destination in xtomp.conf');
		} else {
			console.log('xtomp-console: [error] stats error:' + JSON.stringify(error_frame));
		}
	});

	client.connect();

	xtompReconnect.enableReconnect(client, 2000, 5000);

};

exports.disconnect = function() {
	if ( client ) client.disconnect();
};
