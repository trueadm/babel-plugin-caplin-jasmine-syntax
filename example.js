"use strict";

var babel  = require("babel-core");
var plugin = require("./lib/index");

var code = `
	it('do something', function() {
		waits(1000);
		waitsFor(function() {
			value++;
			return flag;
		}, "The Value should be incremented", 750);
		runs(function() {
			doStuff()
			expect(foo).toBe(bar);
		});
	});
`;

var output = babel.transform(code, {
	plugins: [plugin],
	presets: ['es2015']
}).code;

console.log(output);