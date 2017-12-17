"use strict";

const HEART_BEAT_RATE = 50000;

/**
 * Creates a connection to a xtomp server from a browser using WebSockets.
 * This code is designed for http://xtomp.tp23.org it hardcodes the "stomp" protocol.
 * It sends, and expects, a single STOMP frame per WebSockets message.
 */
function connectStompWebSocket(url, destination, callback) {

	function CONNECT() {
		let frame = "CONNECT\n\n\0";
		return frame;
	}

	function SUBSCRIBE(q) {
		let frame = "SUBSCRIBE\n" +
		"destination:" + q + "\n" + 
		"id:1\n" + 
		"\n\0";
		return frame;
	}

	function SEND(q, message, receipt) {
		let frame = "SEND\ndestination:" + q + "\n" + 
					(receipt ? "receipt:msg" : "") + 
					"\n\n" + message + "\0";
		return frame;
	}

	let conn = {
		webSocket : null,
		destination : destination,
		status : 'CLOSED',
		start : new Date().getTime()
	};

	function status(message) {
		if (callback.status) callback.status(message);
		conn.status = message;
	}

	conn.webSocket = new WebSocket(url, "stomp");
	conn.webSocket.onmessage = function (event) {
		let message = stompFrame.parseStompMessage(event.data);
		if (message.command === 'CONNECTED') {
			status("CONNECTED");
			if (conn.destination) conn.webSocket.send(SUBSCRIBE(conn.destination));
		}
		callback.message(message);
	};

	conn.webSocket.onopen = function(event) {
		if ( conn.webSocket.readyState === 1 ) {
			conn.webSocket.send(CONNECT());
			status("CONNECTING");
		}
		else {
			status("READY_STATE: " + conn.webSocket.readyState);
		}
	};

	conn.webSocket.onclose = function(event) {
		status("CLOSED after " + (new Date().getTime() - conn.start) / 1000 );
	};

	conn.subscribe = function(destination) {
		conn.skipHeartBeat();
		if (destination) {
			conn.destination = destination;
			conn.webSocket.send(SUBSCRIBE(conn.destination));
		}
	};

	conn.sendMessage = function(message, receipt) {
		conn.skipHeartBeat();
		let frame = SEND(conn.destination, message, receipt);
		conn.webSocket.send(frame);
	};

	conn.heartBeat = function() {
		conn.webSocket.send("\n");
		conn.timeout = setTimeout(() => conn.heartBeat(), HEART_BEAT_RATE);
	};

	conn.skipHeartBeat = function() {
		if (conn.timeout) clearTimeout(conn.timeout);
		conn.timeout = setTimeout(() => conn.heartBeat(), HEART_BEAT_RATE);
	};
	
	conn.close = function() {
		if (conn.timeout) clearTimeout(conn.timeout);
		conn.webSocket.close();
		delete conn.destination;
	};

	conn.timeout = setTimeout(conn.heartBeat, HEART_BEAT_RATE);

	status("READY_STATE: " + conn.webSocket.readyState);

	return conn;
}
