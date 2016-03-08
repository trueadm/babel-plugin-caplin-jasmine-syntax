# Caplin Jasmine Syntax Plugin

This is a Babel plugin that converts Jasmine 1.3 test syntax (async functionality) into Mocha async compatible functionality.

For example, the following JavaScript is how a Jasmine 1.3 test might look:

```js
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
```

After parsing through the plugin, the output would be:

```js
it('do something', function (done) {
	setTimeout(function () {
		var waitsForTimeout$2 = setTimeout(function () {
			throw new Error('waitsFor timed out: The Value should be incremented');
		}, 750);
		function waitsForCriteria$0() {
			value++;
			return flag;
		}
		function waitsForPoll$1() {
			if (waitsForCriteria$0()) {
				clearTimeout(waitsForTimeout$2);

				doStuff();
				expect(foo).toBe(bar);
				done();
			} else {
				setTimeout(waitsForPoll$1, 10);
			}
		}

		setTimeout(waitsForPoll$1, 10);
	}, 1000);
});
```

Note: this plugin does not add a reference to `expect` to the scope. This can manually be done using the [expectations library](https://github.com/spmason/expectations):

`var expect = require('expectations');`