"use strict";

const XTOMP_WS_URL = 'ws://' + location.hostname + ':8080/xtomp';
const XTOMP_HEALTH_URL = 'http://' + location.hostname + ':8080/health_check';

// globals, oh naughty
var conn;
var nginConfig;
var nginInfo;
var currentDestination;
const destinationInfo = {};

function sanitizeHash(hash) {
	let sane = "";
	for (let i = 0 ; i < hash.length ; i++) {
		let c = hash.charAt(i);
		if (c >= '0' && c <= '9' ) {
			sane += c;
		}
		else if (c >= 'a' && c <= 'x' ) {
			sane += c;
		}
		else if (c === '-' ) {
			sane += c;
		}
		else if (c === '/' ) {
			sane += c;
		}
	}
	return sane;
}

function setDestination(d) {
	let destination;
	if (d) {
		destination = d;
	}
	else if (document.location.hash) {
		destination = sanitizeHash(document.location.hash);
	}
	if (destination) changeDestination(destination);
}

function insertAfter(newNode, referenceNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function initNginInfo() {
	$.ajax({
		url : '/ngin-info/',
		type : 'GET',
		success : function(data) {
			nginInfo = data;
			renderNginInfo(data);
		},
		error : function(x) {
			status("ngin-info error");
		}
	});
}

function initNginConfig() {
	$.ajax({
		url : '/ngin-config/',
		type : 'GET',
		success : function(data) {
			nginConfig = data;
			renderNginConfig(nginConfig);
		},
		error : function(x) {
			status("ngin-info error");
		}
	});
}

function pollDestination(destination) {
	$.ajax({
		url : '/destination-info/?destination=' + destination,
		type : 'GET',
		success : function(data) {
			// {"sz":0,"q":0,"Δ":0,"Σ":0}
			destinationInfo[destination] = data;
			renderDestinationInfo(data);
		},
		error : function(x) {
			status("ngin-info error");
		}
	});
}

function getHealthCheck() {
	$.ajax({
		url : XTOMP_HEALTH_URL,
		type : 'GET',
		success : function(data, text, res) {
			if ( res.status == 200 ) {
				let xtompVer = res.getResponseHeader("server");
				if ( xtompVer ) {
					renderXtompVer(xtompVer);
					status("ngin up: " + xtompVer);
				}
			}
			else {
				status("/health_check !200");
				renderXtompVer("-");
			}
		},
		error : function(data, res) {
			status("/health_check failed");
			renderXtompVer("-");
		}
	});
}

function createWebSocket() {
	const socket = new WebSocket("ws://" + location.host + "/console");
	socket.addEventListener('message', function (event) {
		renderNginInfo(JSON.parse(event.data));
	});
	socket.addEventListener('close', function (event) {
		status("lost ws connection");
		setTimeout(getHealthCheck, 500);
		setTimeout(createWebSocket, 2000);
	});
}

/**
 * Current stats about the dest, # of subscribers etc
 */
function getDestinationInfo(destination) {
	pollDestination(destination);
	if (destinationInfo) {
		return destinationInfo[destination];
	}
}

/**
 * Static info, name configuration data
 */
function getDestinationConfig(destination) {
	if (nginConfig) {
		for(let i = 0 ; i < nginConfig.destinations.length ; i++ ) {
			if (nginConfig.destinations[i].name === destination) return nginConfig.destinations[i];
		}
	}
}

function changeDestination(destination) {
	currentDestination = destination;
	clearMessages();
	renderDestinationConfig(getDestinationConfig(destination));
	renderDestinationInfo(getDestinationInfo(destination));
	pollDestination(destination);
	renderDestination(destination);
}

function doSubscribe() {
	if ( currentDestination ) {
		if ( conn && conn.status === 'CONNECTED' ) {
			conn.subscribe(currentDestination);
			sendEnable();
		}
	}
	else {
		status("select destination");
	}
}

function doSend(message, receipt) {
	if ( conn && conn.status === 'CONNECTED' && currentDestination ) {
		conn.destination = currentDestination;
		conn.sendMessage(message, receipt);
	}
}

function doDisconnect() {
	if (conn) conn.close();
	sendDisable();
	clearMessages();
}

function doConnect() {
	if (conn) conn.close();
	conn = connectStompWebSocket(XTOMP_WS_URL, null, {
		status : renderStatus,
		message : renderMessage
	});
	sendEnable();
}

$(document).ready(() => {
	getHealthCheck();
	initNginInfo();
	initNginConfig();
	setDestination();
	// boring ol polling (change to push)
	//setInterval(initNginInfo, 60000);
	createWebSocket();
	bind();
	renderUsage();
	sendDisable();
});
