"use strict";

const fs = require('fs');

const defaults = require('./default');

/**
 * Stream the favicon.ico,  
 * the file /view/favicon.png is returned.
 */
exports.doGet = function(request, response, url) {
	
	var instream = fs.createReadStream("./view/favicon.png" , { flags: 'r', bufferSize: 2 * 1024 });

	// set default HTTP headers
	response.statusCode = 200;
	response.setHeader("Content-Type", "image/png");
	
	defaults.addNoCacheHeaders(response);
	
	// TODO should not chunk
	instream.pipe(response);
	
};
