"use strict";

/**
 *  "Servlet" filter for adding the default headers
 */
const filter = function(request, response, chain) {
	
	response.setHeader("Server", "xtomp-console/0.1");
	
	chain.doFilter(request, response);
};

exports.filter = filter;

