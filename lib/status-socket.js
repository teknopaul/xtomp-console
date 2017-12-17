"use strict";

const net = require('net');
const fs = require('fs');
const child_process = require('child_process');
const config = require("./config.js").config;

const UNIX_SOCKET = '/tmp/xtomp-console.sock';

child_process.exec('mkfifo', [UNIX_SOCKET]);


/**
 * Control socket,
 *  
 * 	echo PING | nc -U /tmp/xtomp-console.sock  # log an Alive   
 * 	echo EXIT | nc -U /tmp/xtomp-console.sock  # process exits normally
 * 
 */
const statusSocket = net.createServer(function (c) {
	try{
		let string = '';
		c.on('data', function(buffer) {
			string += buffer.toString('utf-8');
		});
		
		c.on('end', function() {
			if (string.indexOf("PING") === 0) {
				console.log("xtomp-console: [info] Alive");
			}
			else if (string.indexOf("EXIT") === 0) {
				console.log("xtomp-console: [info] Going down");
				process.exit(0);
			}
		});
		
	}
	catch(err) {
		console.log(err);
	}
});
statusSocket.listen(UNIX_SOCKET);

if (config.debug) console.log("xtomp-console: [debug] listening to " + UNIX_SOCKET);

process.on('exit', function() {
	fs.unlink(UNIX_SOCKET);
});