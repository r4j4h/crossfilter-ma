describe('accumulateGroupForNDayMovingAverage', function() {

    var global,
        crossfilterMa;

    var setOfNumbers = [],
        crossfilterInstance,
        dimensionDate,
        dimensionDateForFiltering,
        dimensionVisitsForFiltering,
        groupVisitsByDate,
        groupForTesting;

    beforeEach(function() {
        global = (function() { return this; })();
        crossfilterMa = global['crossfilter-ma'];

        // Ordered, test
        setOfNumbers = [
            { date: "2012-01-11", visits: 2  }, // 2 point  | 3 point
            { date: "2012-01-12", visits: 3  }, // 2.5      | null
            { date: "2012-01-13", visits: 10 }, // 6.5      | 5
            { date: "2012-01-14", visits: 3  }, // 6.5      | 5.333
            { date: "2012-01-15", visits: 10 }, // 6.5      | 7.666
            { date: "2012-01-16", visits: 12 }, // 11       | 8.333
            { date: "2012-01-17", visits: 7  }  // 9.5      | 9.666
        ];

        // TODO Test unordered
        // TODO Test multiple dates that must be pregrouped

        crossfilterInstance = crossfilter( setOfNumbers );
        dimensionDate = crossfilterInstance.dimension(function (d) {
            return d.date
        });
        dimensionDateForFiltering = crossfilterInstance.dimension(function (d) {
            return d.date
        });
        dimensionVisitsForFiltering = crossfilterInstance.dimension(function (d) {
            return d.visits
        });

        groupVisitsByDate = dimensionDate.group().reduceSum( function(d) { return d.visits; } );
    });

    afterEach(function() {
        setOfNumbers = [];
        crossfilterInstance = null;
        dimensionDate = null;
        dimensionDateForFiltering = null;
        dimensionVisitsForFiltering = null;
        groupVisitsByDate = null;

        global = null;
        crossfilterMa = null;
    });


    describe('requires a crossfilter group', function() {

        it('and refuses nothing', function() {

            var tryWithNothing = function() {
                crossfilterMa.accumulateGroupForNDayMovingAverage();
            };

            expect( tryWithNothing ).toThrowError('You must pass in a crossfilter group!');
        });

        it('and refuses a number', function() {

            var tryWithNumber = function() {
                crossfilterMa.accumulateGroupForNDayMovingAverage(3);
            };

            expect( tryWithNumber ).toThrowError('You must pass in a crossfilter group!');
        });

        it('and refuses a string', function() {

            var tryWithString = function() {
                crossfilterMa.accumulateGroupForNDayMovingAverage('lorem');
            };

            expect( tryWithString ).toThrowError('You must pass in a crossfilter group!');
        });

        it('and refuses an object that does not look like a crossfilter group', function() {

            var tryWithObject = function() {
                crossfilterMa.accumulateGroupForNDayMovingAverage({ key: 'lorem', value: 'ipsum' });
            };

            expect( tryWithObject ).toThrowError('You must pass in a crossfilter group!');
            expect( tryWithObject ).toThrowError();
            expect( tryWithObject ).toThrow();
        });

        it('and allows an object that does look like a crossfilter group', function() {

            var tryWithObjectThatMatches = function() {
                crossfilterMa.accumulateGroupForNDayMovingAverage({ all: function() {} });
            };

            expect( tryWithObjectThatMatches ).not.toThrow();
            expect( tryWithObjectThatMatches ).not.toThrowError();
        });

    });


    describe('ndays()', function() {

        it('returns the current number of days', function() {

            var firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            expect( firstRollingAverageFakeGroup.ndays() ).toBe( crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES );

        });

        it('allows to set the current number of days', function() {

            var firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            expect( firstRollingAverageFakeGroup.ndays() ).toBe( crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES );
            firstRollingAverageFakeGroup.ndays(13);
            expect( firstRollingAverageFakeGroup.ndays() ).toBe( 13 );
            expect( firstRollingAverageFakeGroup.ndays() ).not.toBe( crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES );

        });

        it('defaults to constants point at creation time if none is provided', function() {
            // Cache actual
            var currentConstant = crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES;

            crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES = 6;
            var firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            expect( firstRollingAverageFakeGroup.ndays() ).toBe( 6 );


            crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES = 12;
            var secondRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            expect( firstRollingAverageFakeGroup.ndays() ).toBe( 6 );
            expect( secondRollingAverageFakeGroup.ndays() ).toBe( 12 );

            // Restore actual
            crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES = currentConstant;
        });

    });


    describe('all()', function() {

        it('calculate 2 point rolling average over a set of numbers', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 2 );

            var results = rollingAverageFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 2 );
            expect( results[0]._debug.thisResult.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 2.5 );
            expect( results[1]._debug.thisResult.length ).toBe( 2 );
            expect( results[1]._debug.thisResult[0].key ).toBe( '2012-01-11' );
            expect( results[1]._debug.thisResult[1].key ).toBe( '2012-01-12' );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 6.5 );
            expect( results[2]._debug.thisResult.length ).toBe( 2 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBe( 6.5 );
            expect( results[3]._debug.thisResult.length ).toBe( 2 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBe( 6.5 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBe( 11 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBe( 9.5 );

        });

        it('calculate 3 point rolling average over set of numbers', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var results = rollingAverageFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 2 );
            expect( results[0]._debug.thisResult.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 2.5 );
            expect( results[1]._debug.thisResult.length ).toBe( 2 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 5 );
            expect( results[2]._debug.thisResult.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBe( 5.333333333333333 );
            expect( results[3]._debug.thisResult.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBe( 7.666666666666667 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBe( 8.333333333333334 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBe( 9.666666666666666 );

        });

        it('maintains the same ordering as the original group', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var originalResults = groupVisitsByDate.all();
            var results = rollingAverageFakeGroup.all();

            expect( results[0].key ).toBe( originalResults[0].key );
            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[1].key ).toBe( originalResults[1].key );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[2].key ).toBe( originalResults[2].key );
            expect( results[2].key ).toBe( '2012-01-13' );

        });

        it('maintains the same values as the original group', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var originalResults = groupVisitsByDate.all();
            var results = rollingAverageFakeGroup.all();

            expect( results[0].value ).toBe( originalResults[0].value );
            expect( results[1].value ).toBe( originalResults[1].value );
            expect( results[2].value ).toBe( originalResults[2].value );

        });

        it('uses correct dates', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var results = rollingAverageFakeGroup.all();

            expect( results[0]._debug.thisResult.length ).toBe( 1 );
            expect( results[0]._debug.thisResult[ 0 ].key ).toBe( results[ 0 ].key );
            expect( results[1]._debug.thisResult.length ).toBe( 2 );
            expect( results[1]._debug.thisResult[ 0 ].key ).toBe( results[ 0 ].key );
            expect( results[1]._debug.thisResult[ 1 ].key ).toBe( results[ 1 ].key );
            expect( results[2]._debug.thisResult.length ).toBe( 3 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2]._debug.thisResult[ 0 ].key ).toBe( results[ 0 ].key );
            expect( results[2]._debug.thisResult[ 0 ].key ).toBe( '2012-01-11' );
            expect( results[2]._debug.thisResult[ 1 ].key ).toBe( results[ 1 ].key );
            expect( results[2]._debug.thisResult[ 1 ].key ).toBe( '2012-01-12' );
            expect( results[2]._debug.thisResult[ 2 ].key ).toBe( results[ 2 ].key );
            expect( results[2]._debug.thisResult[ 2 ].key ).toBe( '2012-01-13' );

        });


        it('supports filtering in crossfilter', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 2 );
            expect( results[0]._debug.thisResult.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 2.5 );
            expect( results[1]._debug.thisResult.length ).toBe( 2 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 5 );
            expect( results[2]._debug.thisResult.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBe( 5.333333333333333 );
            expect( results[3]._debug.thisResult.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBe( 7.666666666666667 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBe( 8.333333333333334 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBe( 9.666666666666666 );

            dimensionVisitsForFiltering.filterRange( [ 3,11 ] );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 0 );
            expect( results[0]._debug.thisResult.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 1.5 );
            expect( results[1]._debug.thisResult.length ).toBe( 2 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 4.333333333333333 );
            expect( results[2]._debug.thisResult.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBe( 5.333333333333333 );
            expect( results[3]._debug.thisResult.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBe( 7.666666666666667 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBe( 4.333333333333333 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBe( 5.666666666666667 );

        });

    });


    describe('top()', function() {

        it('calculate 2 point rolling average over a set of numbers', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );

            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0].rollingAverage ).toBe( 11 );
            expect( results[0]._debug.thisResult.length ).toBe( 2 );
            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1].rollingAverage ).toBe( 6.5 );
            expect( results[1]._debug.thisResult.length ).toBe( 2 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 6.5 );
            expect( results[2]._debug.thisResult.length ).toBe( 2 );
            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3].rollingAverage ).toBe( 9.5 );
            expect( results[3]._debug.thisResult.length ).toBe( 2 );
            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[4].rollingAverage ).toBe( 6.5 );
            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5].rollingAverage ).toBe( 2.5 );
            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6].rollingAverage ).toBe( 2 );
            expect( results[6]._debug.thisResult.length ).toBe( 1 );

        });

        it('calculate 3 point rolling average over set of numbers', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0].rollingAverage ).toBe( 8.333333333333334 );
            expect( results[0]._debug.thisResult.length ).toBe( 3 );
            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1].rollingAverage ).toBe( 7.666666666666667 );
            expect( results[1]._debug.thisResult.length ).toBe( 3 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 5 );
            expect( results[2]._debug.thisResult.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3].rollingAverage ).toBe( 9.666666666666666 );
            expect( results[3]._debug.thisResult.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[4].rollingAverage ).toBe( 5.333333333333333 );
            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5].rollingAverage ).toBe( 2.5 );
            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6].rollingAverage ).toBe( 2 );
            expect( results[6]._debug.thisResult.length ).toBe( 1 );

        });

        it('maintains the same ordering as the original group', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var originalResults = groupVisitsByDate.top(Infinity);
            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( originalResults[0].key );
            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[1].key ).toBe( originalResults[1].key );
            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[2].key ).toBe( originalResults[2].key );
            expect( results[2].key ).toBe( '2012-01-13' );

        });

        it('maintains the same values as the original group', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var originalResults = groupVisitsByDate.top(Infinity);
            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].value ).toBe( originalResults[0].value );
            expect( results[1].value ).toBe( originalResults[1].value );
            expect( results[2].value ).toBe( originalResults[2].value );

        });

        /**
         * Actual, top order and values:

             key: "2012-01-16"
             value: 12

             key: "2012-01-15"
             value: 10

             key: "2012-01-13"
             value: 10

             key: "2012-01-17"
             value: 7

             key: "2012-01-14"
             value: 3

             key: "2012-01-12"
             value: 3

             key: "2012-01-11"
             value: 2
         */

        it('uses correct dates', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0]._debug.thisResult.length ).toBe( 3 );
            expect( results[0]._debug.thisResult[ 0 ].key ).toBe( '2012-01-14' );
            expect( results[0]._debug.thisResult[ 1 ].key ).toBe( '2012-01-15' );
            expect( results[0]._debug.thisResult[ 2 ].key ).toBe( '2012-01-16' );

            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1]._debug.thisResult.length ).toBe( 3 );
            expect( results[1]._debug.thisResult[ 0 ].key ).toBe( '2012-01-13' );
            expect( results[1]._debug.thisResult[ 1 ].key ).toBe( '2012-01-14' );
            expect( results[1]._debug.thisResult[ 2 ].key ).toBe( '2012-01-15' );

            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2]._debug.thisResult.length ).toBe( 3 );
            expect( results[2]._debug.thisResult[ 0 ].key ).toBe( '2012-01-11' );
            expect( results[2]._debug.thisResult[ 1 ].key ).toBe( '2012-01-12' );
            expect( results[2]._debug.thisResult[ 2 ].key ).toBe( '2012-01-13' );

            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3]._debug.thisResult.length ).toBe( 3 );

            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[4]._debug.thisResult.length ).toBe( 3 );

            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5]._debug.thisResult.length ).toBe( 2 );
            expect( results[5]._debug.thisResult[ 0 ].key ).toBe( '2012-01-11' );
            expect( results[5]._debug.thisResult[ 1 ].key ).toBe( '2012-01-12' );

            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6]._debug.thisResult.length ).toBe( 1 );
            expect( results[6]._debug.thisResult[ 0 ].key ).toBe( '2012-01-11' );

        });

    });


});