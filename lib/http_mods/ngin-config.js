"use strict";

const defaults = 	require('./default.js');
const serverInfo = 	require('../ngin-info.js');

/**
 * Get server configuration, inc list of destinations.
 */
exports.doGet = function(request, response, url) {
	
	defaults.addNoCacheHeaders(response);

	let res = JSON.stringify(serverInfo.getConfig());
	response.writeHead(200, "OK", {
		"Content-Type" : "application/json",
		"Content-Length" : "" + Buffer.byteLength(res, 'utf-8')
	});
	response.write(res);
	response.end();

};
