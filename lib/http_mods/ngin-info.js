"use strict";

const defaults = 	require('./default.js');
const nginInfo = 	require('../ngin-info.js');

/**
 * Get current information about server, e.g. cc, uptime.
 */
exports.doGet = function(request, response, url) {
	
	defaults.addNoCacheHeaders(response);

	let res = JSON.stringify(nginInfo.getServerInfo());
	response.writeHead(200, "OK", {
		"Content-Type" : "application/json",
		"Content-Length" : "" + Buffer.byteLength(res, 'utf-8')
	});
	response.write(res);
	response.end();

};
