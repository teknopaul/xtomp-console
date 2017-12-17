var path = require('path');
var fs = require('fs');

var defaults = require('./default');
var resolve = require('../persistence/file-resolve');

/**
 * Stream a named file to the response.
 * Also parses SSI if the data is HTML.
 * 
 * This is the module that streamns the client side APP to the browser, it is pretty much a simple
 * file server.
 */
exports.doGet = function(request, response, url) {
	
	if ( url.pathname === "/" ) {
		url.pathname = "/index.html";
	}

	resolve.resolveApp(url.pathname, true, function(fileSystemPath) {

		// set default HTTP headers
		response.statusCode = 200;
		var mime = defaults.mimeMagic(response, url.pathname);
		response.setHeader("Content-Type", mime);
		defaults.addNoCacheHeaders(response);

		// open the file
		var instream = null;
		if ( defaults.mimeMagicIsText(url.pathname) ) {
			instream = fs.createReadStream(fileSystemPath, { flags: 'r', encoding: 'utf8' });
		} else {
			instream = fs.createReadStream(fileSystemPath);
		}
		
		instream.on('error', function() {
			// TODO this is not correct FNF should be detected some other way
			defaults.fileNotFound(response);
			return;
		});
		
		instream.pipe(response);
		
	});
	
};
