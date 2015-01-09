describe('crossfilter-ma', function() {

    var global,
        crossfilterMa;

    beforeEach(function() {
        global = (function() { return this; })();
        crossfilterMa = global['crossfilter-ma'];
    });

    afterEach(function() {
        global = null;
        crossfilterMa = null;
    });

    it('provides a rolling average function', function() {

        expect( typeof crossfilterMa.accumulateGroupForNDayMovingAverage ).toBe( 'function' );

    });

});