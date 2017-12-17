"use strict";

var defaults = require('./default.js');
const nginInfo = require('../ngin-info.js');

/**
 * Get current infora bout a destination
 */
exports.doGet = function(request, response, url) {
	
	defaults.addNoCacheHeaders(response);


	if (url.query && url.query.destination) {

		let info = nginInfo.getDestinationInfo(url.query.destination);
		
		if (info) {
			let res = JSON.stringify(info);

			response.writeHead(200, "OK", {
				"Content-Type" : "application/json",
				"Content-Length" : "" + Buffer.byteLength(res, 'utf-8')
			});
			response.write(res);
			response.end();
			return;
		}

	}

	defaults.fileNotFound(response);

};
