"use strict";

var babel  = require("babel-core");
var plugin = require("./lib/index");

var code = `
it("should update the fixing date when current date is another tenor", () => {
			leg.setFieldValue("Tenor", "SPOT");

			let stubEvent = {
				getFields: function() {
					return {
						ForwardType: 'NDF',
						FixingDates: '{"1W": "20160403"}'
					};
				}
			};

			let getSelectedValueStub = {
				getSelectedValue: () => {
					return { tenor: "1W", date: "20160404" };
				}
			};

			var tenorDatesListener = CTSL.getSLJS().subscribe.lastCall.args[1];
			tenorDatesListener.onRecordUpdate(null, stubEvent);

			modalBox.querySelector = sinon.stub().withArgs('caplin-calendar-tenor-picker').returns(getSelectedValueStub);

			waits(20)
			runs(() => {
				tradeTicket.showCalendarTenorPicker();
				modalBox.trigger("button-click-ok");

				expect(tradeTicket.isCurrencyPairNDF()).toBe(true);
				expect(tradeTicket.ndfFixingDate()).toBe("03/04/2016");
			})

		});
`;

var output = babel.transform(code, {
	plugins: [plugin],
	presets: ['es2015']
}).code;

console.log(output);