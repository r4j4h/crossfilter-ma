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

        var meh = crossfilterMa.accumulateGroupForNDayMovingAverage;

        expect( typeof meh ).toBe( 'function' );

    });

    it('takes a crossfilter group', function() {

    });

    it('throws error if given a direct array', function() {

    });

    it('calculates a moving average', function() {

    });

    describe('math', function() {

        var setOfNumbers = [];

        beforeEach(function() {
            setOfNumbers = [
                { key: 1, value: 2  },
                { key: 2, value: 3  },
                { key: 3, value: 10 },
                { key: 4, value: 3  },
                { key: 5, value: 10 },
                { key: 6, value: 12 },
                { key: 7, value: 7  }
            ];
        });

        afterEach(function() {
            setOfNumbers = [];
        });

        it('calculate average over set of numbers', function() {
            // Given
        });

        it('calculate 2-unit moving average over set of numbers', function() {


        });
    });

    describe('calculates moving averages', function() {

        beforeEach(function() {

        });

        afterEach(function() {

        });

        it('calculates the normal average', function() {

        });

        it('grabs the appropriate prior rows for moving average', function() {

        });

        it('calculates a 2 day moving average', function() {

        });

    });

});