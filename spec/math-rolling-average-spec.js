describe('math-rolling-average', function() {

    var global,
        crossfilterMa;

    var setOfNumbers = [],
        crossfilterInstance,
        dimensionDate,
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
        groupVisitsByDate = dimensionDate.group().reduceSum( function(d) { return d.visits; } );

        groupForTesting = dimensionDate.group();
    });

    afterEach(function() {
        setOfNumbers = [];
        crossfilterInstance = null;
        dimensionDate = null;
        groupVisitsByDate = null;
        groupForTesting = null;

        global = null;
        crossfilterMa = null;
    });


    it('calculate 2 point rolling average over a set of numbers', function() {

        var rollingAverageFakeGroup = crossfilterMa.accumulateGroupFor2DayMovingAverage( groupVisitsByDate );

        var results = rollingAverageFakeGroup.all();

        expect( results[0].key ).toBe( '2012-01-11' );
        expect( results[0].value ).toBe( 2 );
        expect( results[0].debug.thisResult.length ).toBe( 1 );
        expect( results[1].key ).toBe( '2012-01-12' );
        expect( results[1].value ).toBe( 2.5 );
        expect( results[1].debug.thisResult.length ).toBe( 2 );
        expect( results[2].key ).toBe( '2012-01-13' );
        expect( results[2].value ).toBe( 6.5 );
        expect( results[2].debug.thisResult.length ).toBe( 2 );
        expect( results[3].key ).toBe( '2012-01-14' );
        expect( results[3].value ).toBe( 6.5 );
        expect( results[3].debug.thisResult.length ).toBe( 2 );
        expect( results[4].key ).toBe( '2012-01-15' );
        expect( results[4].value ).toBe( 6.5 );
        expect( results[5].key ).toBe( '2012-01-16' );
        expect( results[5].value ).toBe( 11 );
        expect( results[6].key ).toBe( '2012-01-17' );
        expect( results[6].value ).toBe( 9.5 );

    });

    it('calculate 3 point rolling average over set of numbers', function() {

        var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

        var results = rollingAverageFakeGroup.all();

        expect( results[0].key ).toBe( '2012-01-11' );
        expect( results[0].value ).toBe( 2 );
        expect( results[0].debug.thisResult.length ).toBe( 1 );
        expect( results[1].key ).toBe( '2012-01-12' );
        expect( results[1].value ).toBe( 2.5 );
        expect( results[1].debug.thisResult.length ).toBe( 2 );
        expect( results[2].key ).toBe( '2012-01-13' );
        expect( results[2].value ).toBe( 5 );
        expect( results[2].debug.thisResult.length ).toBe( 3 );
        expect( results[3].key ).toBe( '2012-01-14' );
        expect( results[3].value ).toBe( 5.333333333333333 );
        expect( results[3].debug.thisResult.length ).toBe( 3 );
        expect( results[4].key ).toBe( '2012-01-15' );
        expect( results[4].value ).toBe( 7.666666666666667 );
        expect( results[5].key ).toBe( '2012-01-16' );
        expect( results[5].value ).toBe( 8.333333333333334 );
        expect( results[6].key ).toBe( '2012-01-17' );
        expect( results[6].value ).toBe( 9.666666666666666 );

    });

});