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

            it("there should be no loading functionality for adding blocks above and below", function () {
                runs(function () {
                    expect(list.canAddBottomBlock()).toBe(false);
                    expect(list.canAddTopBlock()).toBe(false);
                });
            });

            describe("data rows 0-9 are removed, causing all current visible rows to be removed", function () {

                beforeEach(function () {
                    list.setTotalRows(0);
                    waits(100);
                });

                it("there should be no rows", function () {
                    runs(function () {
                        expect(list.getTotalRows()).toBe(0);
                    });
                });

            });
        });

        var list;
        listContainer.innerHTML = '';
        list = new InfiniteList({
            container: listContainer,
            windowSize: 5,
            windowCount: 2,
            minimumWait: 1,
            blockFactory: TestBlockFactory
                .setRows(testRows)
                .setOffline(false)
        }).setTotalRows(10);

        list.init();

        describe("with a window size of 5 and a window count of 2", function () {
            it("the first block should contain data for rows 0-4", function () {
                runs(function () {
                    waits(100);
                    expect(list.getRowsRange().start).toBe(0);
                    expect(list.getRowsRange().end).toBe(4);
                });
            });

            it("there should be loading functionality for adding blocks below but not above", function () {
                runs(function () {
                    expect(list.canAddBottomBlock()).toBe(true);
                    expect(list.canAddTopBlock()).toBe(false);
                });
            });

            describe("upon loading the next block (below)", function () {
                it("the block should contain rows 0-9 and there should be no loading functionality for adding blocks", function () {
                    setTimeout(function () {
                        list._addBottomBlock();

                        setTimeout(function () {
                            expect(list.getRowsRange().start).toBe(0);
                            expect(list.getRowsRange().end).toBe(9);
                            expect(list.canAddBottomBlock()).toBe(false);
                            expect(list.canAddTopBlock()).toBe(false);
                        }, 300)
                    }, 100);
                });

                describe("data rows 7, 8, 9 are removed", function () {
                    it("the block should now only contain rows 0-6", function () {
                        setTimeout(function () {
                            list.setTotalRows(7);
                        }, 500);

                        setTimeout(function () {
                            expect(list.getRowsRange().start).toBe(0);
                            expect(list.getRowsRange().end).toBe(6);
                        }, 1000);
                    });
                });
            });
        });
    });

    describe("With 100 rows of backend data", function () {
        var testRows = createDummyData(100),
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

            it("there should be no loading functionality for adding blocks above and below", function () {
                runs(function () {
                    expect(list.canAddBottomBlock()).toBe(false);
                    expect(list.canAddTopBlock()).toBe(false);
                });
            });

            describe("data rows 0-9 are removed, causing all current visible rows to be removed", function () {

                beforeEach(function () {
                    list.setTotalRows(0);
                    waits(100);
                });

                it("there should be no rows", function () {
                    runs(function () {
                        expect(list.getTotalRows()).toBe(0);
                    });
                });

            });
        });


        describe("with a window size of 50 and a window count of 2", function () {

            describe("there is a bad data connection and an attempt to load the next block is made", function () {

                var testList;

                it("the retry button should be available and the range of rows for 0-49 should be shown", function () {

                    listContainer.innerHTML = '';
                    testList = new InfiniteList({
                        container: listContainer,
                        windowSize: 50,
                        minimumWait: 1,
                        windowCount: 2,
                        blockFactory: TestBlockFactory
                            .setRows(testRows)
                    }).setTotalRows(100);

                    testList.init();

                    setTimeout(function () {
                        TestBlockFactory.setOffline(true);
                        testList._addBottomBlock();
                    }, 100);

                    setTimeout(function () {
                        expect(testList._topRetryButton.style.display).toBe('block');
                        expect(testList._bottomRetryButton.style.display).toBe('block');
                        expect(testList.getRowsRange().start).toBe(0);
                        expect(testList.getRowsRange().end).toBe(49);
                    }, 200)

                });


                describe("data connection is good again and an attempt to load the next block is made", function () {

                    it("the range of rows for 0-99 should be shown and the retry button should no longer be available", function () {

                        setTimeout(function () {
                            TestBlockFactory.setOffline(false);
                            testList._addBottomBlock();
                        }, 1000);

                        setTimeout(function () {
                            expect(testList.getRowsRange().start).toBe(0);
                            expect(testList.getRowsRange().end).toBe(99);
                            expect(testList._topRetryButton.style.display).toBe('none');
                            expect(testList._bottomRetryButton.style.display).toBe('none');
                        }, 1500);
                    });
                });
            });
        });


        describe("With 100,000 rows of backend data", function () {
            var testRows = createDummyData(100000),
                listContainer = document.createElement("div");
            testBed.appendChild(listContainer);

            describe("with a window size of 25 and a window count of 2", function () {
                listContainer.innerHTML = '';
                var list = new InfiniteList({
                    container: listContainer,
                    windowSize: 25,
                    minimumWait: 1,
                    windowCount: 2,
                    blockFactory: TestBlockFactory
                        .setRows(testRows)
                        .setOffline(false)
                }).setTotalRows(100000);

                list.init();

                describe("go to range 99,975-99,999", function () {
                    beforeEach(function () {
                        list.goTo(99975);
                        waits(100);
                    });

                    it("the range of rows for 99,974-99,999 should be shown (as 25 is the window size)", function () {
                        runs(function () {
                            expect(list.getRowsRange().start).toBe(99975);
                            expect(list.getRowsRange().end).toBe(99999);
                        });
                    });
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