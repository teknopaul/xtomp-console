"use strict";

const path = require('path');
const fs = require('fs');

const viewDir = "./view";

/**
 * resolves HTML o CSS files
 */
exports.resolveApp = function(pathname, forweb, callback) {

	// console.log("Resolving " + pathname);
	
	if (pathname.indexOf('..') >= 0) {
		throw new Error("../ trickery");
	}
	
	if (pathname.charAt(0) != '/') {
		pathname = '/' + pathname;
	}

	// get path in the filesystem
	var fileSystemPath = path.normalize("./view" + pathname);
	
	// TODO check for base validity
	callback(fileSystemPath);
};

