"use strict";

var babel  = require("babel-core");
var plugin = require("./lib/index");

var code = `
describe("Infinite Test", function() {
    describe("With 10 rows of backend data", function () {

        var testRows = createDummyData(10),
            listContainer = document.createElement("div");

        testBed.appendChild(listContainer);

        describe("with a window size of 10 and a window count of 2", function () {
            var list;

            beforeEach(function () {
                listContainer.innerHTML = '';
                list = new InfiniteList({
                    container: listContainer,
                    windowSize: 10,
                    minimumWait: 1,
                    windowCount: 2,
                    blockFactory: TestBlockFactory
                        .setRows(testRows)
                        .setOffline(false)
                }).setTotalRows(10);

                list.init();

                waits(100);
            });

            it("the first block should contain rows 0-9", function () {
                runs(function () {
                    expect(list.getRowsRange().start).toBe(0);
                    expect(list.getRowsRange().end).toBe(9);
                });
            });
		});
    });
});
`;

var output = babel.transform(code, {
	plugins: [plugin],
	presets: ['es2015']
}).code;

console.log(output);