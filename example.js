"use strict";

var babel  = require("babel-core");
var plugin = require("./lib/index");

var code = `
var sinon = require("sinon");

var AppRouter = require("router/AppRouter");
var DummyRouteConfig = require("router/DummyConfig").dummyRouteConfig;
var DummyHandlers = require("router/DummyConfig").dummyHandlers;

describe("Test the AppRouter", function () {
	var sandbox = null;
	var routerGoSpy = null;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		routerGoSpy = sandbox.spy(AppRouter, "go");
		AppRouter.config(DummyRouteConfig);

	});

	afterEach(function () {
		sandbox.restore();
	});

	it("should trigger the correct entering callbacks when going to the first route.", function() {
		AppRouter.go("/foo/bar");

		waits(100);

		runs(function() {
			sinon.assert.calledOnce(DummyHandlers.indexHandler.enter);
			sinon.assert.calledOnce(DummyHandlers.mainSectionHandler.enter);
			sinon.assert.calledOnce(DummyHandlers.subSectionHandler.enter);
		});
	});

	// Going from "/foo/bar" to  "buzz/bizz"
	it("should trigger the correct exiting, updating and entering callbacks when changing route", function() {
		DummyHandlers.indexHandler.updateSettings.returns(false);
		DummyHandlers.mainSectionHandler.updateSettings.returns(true);
		DummyHandlers.subSectionHandler.updateSettings.returns(true);

		AppRouter.go("/buzz/bizz");

		waits(100);

		runs(function() {
			sinon.assert.called(DummyHandlers.subSectionHandler.exit);
			sinon.assert.called(DummyHandlers.mainSectionHandler.exit);
			sinon.assert.called(DummyHandlers.indexHandler.update);
			sinon.assert.called(DummyHandlers.mainSectionHandler.enter);
			sinon.assert.called(DummyHandlers.subSectionHandler.enter);
		});
	});

	it("should throw an Error if a route change is raised while one is being processed", function (done) {
		var reject = sinon.spy();

		AppRouter.go("/foo/bar");

		waits(100);

		runs(function() {
			AppRouter.go("/foo").then(null, reject).catch(reject);
		});

		waits(100);

		runs(function() {
			sinon.assert.calledOnce(reject);
		});
	});
});
`;

var output = babel.transform(code, {
	plugins: [plugin],
	presets: ['es2015']
}).code;

console.log(output);