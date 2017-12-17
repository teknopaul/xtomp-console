"use strict";

/**
 * A STOMP frame parser, written for the xtomp console.
 *
 * Expectes TEXT frames (not binary), the frame must be terminated with \0 per the STOMP spec.
 */

(function(exports){


//states
const INIT         = 0;
const COMMAND      = 1;
const HEADER_NAME  = 2;
const HEADER_VALUE = 3;
const BODY         = 4;

const Frame = function() {
	this.state = INIT;
	this.command = null;
	this.headers = {};
	this.body = null;
};

/**
 * @param message a String containing a STOMP frame.
 * @return A STOMP Frame
 */
exports.parseStompMessage = function(message) {
	let frame = new Frame();
	if ( parseStompData(frame, message) ) return frame;
	throw Error("invalid_frame");
};

/**
 * @return true|false for success or fail
 */
const parseStompData = function(frame, message) {
	let c;
	let startPos = 0;
	let name;
	let value;
	for (let i = 0 ; i < message.length ; i++ ) {
		c = message.charAt(i);
		switch (frame.state) {

			case INIT:
				if ( c === '\0' ) throw Error("Invalid frame");
				if ( c === '\n' || c === '\r' ) continue;
				startPos = i;
				frame.state = COMMAND;
				continue;

			case COMMAND:
				if ( c === '\0' ) throw Error("Invalid frame");
				if ( c === '\n' ) {
					frame.command = message.slice(startPos, i).trim();
					frame.state = HEADER_NAME;
					startPos = i + 1;
				}
				continue;

			case HEADER_NAME:
				if ( c === '\0' ) throw Error("Invalid frame");
				if ( c === ':' ) {
					name = message.slice(startPos, i);
					frame.state = HEADER_VALUE;
					startPos = i + 1;
				}
				if ( c === '\n' ) {
					frame.state = BODY;
					startPos = i + 1;
				}
				continue;

			case HEADER_VALUE:
				if ( c === '\n' ) {
					value = message.slice(startPos, i).trim();
					startPos = i + 1;
					frame.state = HEADER_NAME;
					frame.headers[name] = value;
				}
				continue;

			case BODY:
				if ( c === '\0' ) {
					frame.body = message.slice(startPos, i);
					return true;
				}
				continue;

		}
	}

	return false;

};

})(typeof exports === 'undefined' ? window.stompFrame = {} : exports);