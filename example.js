"use strict";

var babel  = require("babel-core");
var plugin = require("./lib/index");

var code = `
it("should not trigger long click if within timeout", function() {
	createNumericKeyboard();
	dummyElement = document.createElement("td");
	dummyElement.dataset.value = "delete";

	dummyEvent = {
		preventDefault: dummPreventDefault,
		stopPropagation: dummyStopPropagation,
		target: dummyElement
	};

	numericKeyboard.touchStart(dummyEvent);
	waits(KeyboardConstants.LONG_CLICK_TIMEOUT - 100);

	runs(function() {
			numericKeyboard.touchEnd(dummyEvent);

			expect(longClickCalled).toBe(false);
			expect(dummPreventDefault.called).toBe(true);
			expect(dummyStopPropagation.called).toBe(true);
		}
	);
});
`;

var output = babel.transform(code, {
	plugins: [plugin],
	presets: ['es2015']
}).code;

console.log(output);