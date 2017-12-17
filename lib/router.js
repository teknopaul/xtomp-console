"use strict";

const parse = require('url').parse;
const resolveObject = require('url').resolveObject;

const defaults = 				require('./http_mods/default.js');

const faviconModule =			require('./http_mods/favicon.js');
const nginConfigModule = 		require('./http_mods/ngin-config.js');
const nginInfoModule = 			require('./http_mods/ngin-info.js');
const destinationInfoModule = 	require('./http_mods/destination-info.js');
const viewModule = 				require('./http_mods/view.js');

/**
 * Router routes requests to the correct module.
 * It parses the URI and calls doGet or doPost of the modules.
 */
const route = function(request, response, chain) {
	try {
		
		let url = parse(request.url, true);
		url = resolveObject(url, url); // strange syntax (url passed twice) but this resolves ../../ paths in the URL
		url = parse(request.url, true);
		
		if (url.pathname.indexOf('/ngin-config/') === 0) {
			service(nginConfigModule, request, response, url);
		}
		else if (url.pathname.indexOf('/ngin-info/') === 0) {
			service(nginInfoModule, request, response, url);
		}
		else if (url.pathname.indexOf('/destination-info/') === 0) {
			service(destinationInfoModule, request, response, url);
		}
		else if (url.pathname.indexOf('/favicon.png') === 0 ||  url.pathname.indexOf('/favicon.ico') === 0) {
			service(faviconModule, request, response, url);
		}
		else if (request.method === 'GET') {
			service(viewModule, request, response, url);
		}
		else {
			defaults.badRequest(response);
		}
	}
	catch (err) {
		console.dir(err.stack);
		console.log("Router error: " + err);
	}
	
	chain.doFilter(request, response);
	
};

/**
 * select doGet or doPost for modules that might handle both
 */
const service = function(module, request, response, url) {
	if (request.method === 'GET') {
		module.doGet(request, response, url);
	}
	else if (request.method === 'POST') {
		module.doPost(request, response, url);
	}
	else if (request.method === 'DELETE') {
		module.doDelete(request, response, url);
	}
};

exports.route = route;
exports.filter = route;

