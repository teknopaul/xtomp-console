"use strict";

const assert = require('assert');

var stompFrame = require("../view/xtomp-frame.js");


var frame = stompFrame.parseStompMessage("CONNECT\nfoo:baa\n\n\0");
assert.equal("CONNECT", frame.command);
assert.equal("baa", frame.headers.foo);
assert.ok(typeof frame.body === 'string');
assert.equal("", frame.body);

frame = stompFrame.parseStompMessage("CONNECT\nfoo:baa\nquxx:wibble\n\n{}\0");
assert.equal("CONNECT", frame.command);
assert.equal("baa", frame.headers.foo);
assert.equal("wibble", frame.headers.quxx);
assert.equal("{}", frame.body);

frame = stompFrame.parseStompMessage("CONNECT\nfoo:baa\n\n{}\0");
assert.equal("CONNECT", frame.command);
assert.equal("baa", frame.headers.foo);
assert.equal("{}", frame.body);


