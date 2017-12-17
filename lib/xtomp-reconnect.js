"use strict";


class SocketManager {

	constructor() {
		this.sockets = [];
	}

	manage(socket) {
		this.sockets.push(socket);
	}

	cleanup() {
		this.sockets.forEach((socket) => {
			doClearInterval(socket);
			socket.unref();
			socket.destroy();
		});
		//console.log(process._getActiveHandles());
	}
}

const SOCKET_MANAGER = new SocketManager();

process.on('SIGINT', () => {
	SOCKET_MANAGER.cleanup();
});

/**
 * Listens for connection errors and reconnects a Stomp client's socket.
 *
 * Nothing else should  call Stomp.connect(), since this always creats a new socket.
 * If that does happen this code should be OK since it sets the interval on the socket and not the client.
 *
 * TODO should be a module.
 */ 
exports.enableReconnect = function(client, initial, interval) {

	if ( typeof client.connectRetries === 'undefined' ) client.connectRetries = 0;

	// Stomp only handles the "close" event
	//client.on("disconnected", (err) => loopReconnect(client, interval));

	// attach to socket events instead
	var socket = client.socket;
	SOCKET_MANAGER.manage(socket);

	socket.on('close', (err) => {
		if ( client.connectRetries === 0 ) {
			setTimeout( () => {
				socket.destroy();
				if (client.allowClose) return;
				if (socket.destroyed) reconnectClient(client, socket, initial, interval);
			}, initial);
		}
		loopReconnect(client, socket, initial, interval);
	});

};

exports.disableReconnect = function(client) {
	client.allowClose = true;
};

/**
 * @param client - this contains a socket
 * @param socket - this is the socket that failed.
 */
function reconnectClient(client, socket, initial, interval) {
	// Connect creates a new client.socket instance
	client.connectRetries++;
	client.connect();
	exports.enableReconnect(client, initial, interval);

	client.socket.on('connect', () => {
		//console.log("reconnected");
		client.connectRetries = 0;
		doClearInterval(socket);
	});
	// Good or bad we stop the interval on this socket, since we have reconnect on the new one
	client.socket.on('close', () => doClearInterval(socket));
	client.socket.on('end', () => doClearInterval(socket));

	// TODO is there a race where we might miss the  connect event?

}

function loopReconnect(client, socket, initial, interval) {

	if (client.allowClose) return;

	if (socket.retryTimeout) return;

	/**
	 * Create the timeout on the OLD socket, not the client.
	 */
	socket.retryTimeout = setInterval( () => {

		// Added in: v6.1.0
		if (client.socket.connecting)  return;

		if (socket.destroyed) reconnectClient(client, socket, initial, interval);
		else {
			// should this happen? maybe a race, if so we wait
			console.log("socket in unknown state");
		}

	}, interval);

}

function doClearInterval(socket) {
	if (socket.retryTimeout) {
		clearInterval(socket.retryTimeout);
		delete socket.retryTimeout;
	}
}
