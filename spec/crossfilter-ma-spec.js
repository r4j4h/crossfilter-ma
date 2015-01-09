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

    it('is a function', function() {

        var meh = crossfilterMa['crossfilter-ma'];

        expect( typeof meh ).toBe( 'function' );

    });

    it('says hello', function() {

        var response = crossfilterMa['crossfilter-ma']();

        expect( response ).toBe('hello world');
    });

    xit('takes a crossfilter group', function() {

    });

    it('calculates a moving average', function() {

    });

});