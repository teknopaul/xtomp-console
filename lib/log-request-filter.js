"use strict";

const parse = require('url').parse;

/**
 *  filter logging the URL requested
 */
const filter = function(request, response, chain) {
	
	let url = request.attributes.url;
	console.log(request.method + " " + url.pathname);
	
	chain.doFilter(request, response);
	
};

exports.filter = filter;
