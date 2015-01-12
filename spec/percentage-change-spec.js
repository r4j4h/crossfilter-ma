describe('accumulateGroupForPercentageChange', function() {

    var global,
        crossfilterMa;

    var setOfNumbers = [],
        crossfilterInstance,
        dimensionDate,
        groupVisitsByDate;

    /**
     * Rebuild crossfilter, dimension, and group with mock data.
     * @param {[{date: String, visits: Number}]} mockData
     */
    function rebuildMockCrossfilterWithMockData( mockData ) {

        crossfilterInstance = crossfilter( mockData );
        dimensionDate = crossfilterInstance.dimension(function (d) {
            return d.date
        });
        groupVisitsByDate = dimensionDate.group().reduceSum( function(d) { return d.visits; } );

    }

    /**
     * Mock ordered, unique test data
     */
    function mockOrderedUniqueData() {

        setOfNumbers = [
            { date: "2012-01-11", visits: 2  }, // % chaange
            { date: "2012-01-12", visits: 3  }, // 50%  ( ( 3  - 2  ) / 2 )  * 100
            { date: "2012-01-13", visits: 10 }, // 233.33333333333334%     ( ( 10 - 3  ) / 3 )  * 100
            { date: "2012-01-14", visits: 3  }, // -70%     ( ( 3  - 10 ) / 10)  * 100
            { date: "2012-01-15", visits: 10 }, // 233.33333333333334%     ( ( 10 - 3  ) / 3 )  * 100
            { date: "2012-01-16", visits: 12 }, // 20%
            { date: "2012-01-17", visits: 7  }  // -41.67%
        ];

        rebuildMockCrossfilterWithMockData( setOfNumbers );
    }

    /**
     * Mock unordered, unique test data
     */
    function mockUnorderedUniqueData() {

        setOfNumbers = [
            { date: "2012-01-11", visits: 2  },
            { date: "2012-01-13", visits: 10 },
            { date: "2012-01-17", visits: 7  },
            { date: "2012-01-16", visits: 12 },
            { date: "2012-01-14", visits: 3  },
            { date: "2012-01-15", visits: 10 },
            { date: "2012-01-12", visits: 3  }
        ];

        rebuildMockCrossfilterWithMockData( setOfNumbers );

    }

    /**
     * Mock unordered, redundant test data
     */
    function mockUnorderedRedundantData() {

        setOfNumbers = [
            { date: "2012-01-11", visits: 2  },
            { date: "2012-01-12", visits: 3  },
            { date: "2012-01-13", visits: 10 },
            { date: "2012-01-11", visits: 3  },
            { date: "2012-01-15", visits: 10 },
            { date: "2012-01-12", visits: 12 },
            { date: "2012-01-13", visits: 7  }
        ];

        rebuildMockCrossfilterWithMockData( setOfNumbers );

    }


    beforeEach(function() {
        global = (function() { return this; })();
        crossfilterMa = global['crossfilter-ma'];

        mockOrderedUniqueData();

        // TODO Test unordered
        // TODO Test multiple dates that must be pregrouped
    });

    afterEach(function() {
        setOfNumbers = [];
        crossfilterInstance = null;
        dimensionDate = null;
        groupVisitsByDate = null;

        global = null;
        crossfilterMa = null;
    });


    describe('requires a crossfilter group', function() {

        it('and refuses nothing', function() {

            var tryWithNothing = function() {
                crossfilterMa.accumulateGroupForPercentageChange();
            };

            expect( tryWithNothing ).toThrowError('You must pass in a crossfilter group!');
        });

        it('and refuses a number', function() {

            var tryWithNumber = function() {
                crossfilterMa.accumulateGroupForPercentageChange(3);
            };

            expect( tryWithNumber ).toThrowError('You must pass in a crossfilter group!');
        });

        it('and refuses a string', function() {

            var tryWithString = function() {
                crossfilterMa.accumulateGroupForPercentageChange('lorem');
            };

            expect( tryWithString ).toThrowError('You must pass in a crossfilter group!');
        });

        it('and refuses an object that does not look like a crossfilter group', function() {

            var tryWithObject = function() {
                crossfilterMa.accumulateGroupForPercentageChange({ key: 'lorem', value: 'ipsum' });
            };

            expect( tryWithObject ).toThrowError('You must pass in a crossfilter group!');
            expect( tryWithObject ).toThrowError();
            expect( tryWithObject ).toThrow();
        });

        it('and allows an object that does look like a crossfilter group', function() {

            var tryWithObjectThatMatches = function() {
                crossfilterMa.accumulateGroupForPercentageChange({ all: function() {} });
            };

            expect( tryWithObjectThatMatches ).not.toThrow();
            expect( tryWithObjectThatMatches ).not.toThrowError();
        });

    });


    describe('all()', function() {

        it('calculates percentage change for a set of numbers', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].percentageChange ).toBe( 0 );
            expect( results[1].percentageChange ).toBe( 50 );
            expect( results[2].percentageChange ).toBe( 233.33333333333334 );
            expect( results[3].percentageChange ).toBe( -70 );
            expect( results[4].percentageChange ).toBe( 233.33333333333334 );
            expect( results[5].percentageChange ).toBe( 20 );
            expect( results[6].percentageChange ).toBe( -41.66666666666667 );

        });

        it('maintains the same ordering as the original group', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var originalResults = groupVisitsByDate.all();
            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( originalResults[0].key );
            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[1].key ).toBe( originalResults[1].key );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[2].key ).toBe( originalResults[2].key );
            expect( results[2].key ).toBe( '2012-01-13' );

        });

        it('maintains the same values as the original group', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var originalResults = groupVisitsByDate.all();
            var results = percentageChangeFakeGroup.all();

            expect( results[0].value ).toBe( originalResults[0].value );
            expect( results[1].value ).toBe( originalResults[1].value );
            expect( results[2].value ).toBe( originalResults[2].value );

        });

        it('uses correct dates', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();


            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[6].key ).toBe( '2012-01-17' );

            expect( results[0]._debug.thisDayKey ).toBe( '2012-01-11' );
            expect( results[0]._debug.prevDayKey ).toBe( 'None' );

            expect( results[1]._debug.thisDayKey ).toBe( '2012-01-12' );
            expect( results[1]._debug.prevDayKey ).toBe( '2012-01-11' );

            expect( results[2]._debug.thisDayKey ).toBe( '2012-01-13' );
            expect( results[2]._debug.prevDayKey ).toBe( '2012-01-12' );

            expect( results[3]._debug.thisDayKey ).toBe( '2012-01-14' );
            expect( results[3]._debug.prevDayKey ).toBe( '2012-01-13' );

        });

        it('handles out of order dates', function() {

            mockUnorderedUniqueData();

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].percentageChange ).toBe( 0 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].percentageChange ).toBe( 50 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].percentageChange ).toBe( 233.33333333333334 );

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0]._debug.thisDayKey ).toBe( '2012-01-11' );
            expect( results[0]._debug.prevDayKey ).toBe( 'None' );

            expect( results[1]._debug.thisDayKey ).toBe( '2012-01-12' );
            expect( results[1]._debug.prevDayKey ).toBe( '2012-01-11' );

        });

        it('handles redundant dates', function() {

            mockUnorderedRedundantData();

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' ); //5
            expect( results[0].percentageChange ).toBe( 0 );
            expect( results[1].key ).toBe( '2012-01-12' ); // 15
            expect( results[1].percentageChange ).toBe( 200 );
            expect( results[2].key ).toBe( '2012-01-13' ); // 17
            expect( results[2].percentageChange ).toBe( 13.333333333333334 );
            expect( results[3].key ).toBe( '2012-01-15' ); // 10
            expect( results[3].percentageChange ).toBe( -41.17647058823529 );

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0]._debug.thisDayKey ).toBe( '2012-01-11' );
            expect( results[0]._debug.prevDayKey ).toBe( 'None' );

            expect( results[1]._debug.thisDayKey ).toBe( '2012-01-12' );
            expect( results[1]._debug.prevDayKey ).toBe( '2012-01-11' );

            expect( results[2]._debug.thisDayKey ).toBe( '2012-01-13' );
            expect( results[2]._debug.prevDayKey ).toBe( '2012-01-12' );

            // 14 is missing

            expect( results[3]._debug.thisDayKey ).toBe( '2012-01-15' );
            expect( results[3]._debug.prevDayKey ).toBe( '2012-01-13' );

        });


    });

    /**
     *
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


    describe('top()', function() {

        it('calculates percentage change for a set of numbers', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].percentageChange ).toBe( 20 );
            expect( results[1].percentageChange ).toBe( 233.33333333333334 );
            expect( results[2].percentageChange ).toBe( 233.33333333333334 );
            expect( results[3].percentageChange ).toBe( -41.66666666666667 );
            expect( results[4].percentageChange ).toBe( -70 );
            expect( results[5].percentageChange ).toBe( 50 );
            expect( results[6].percentageChange ).toBe( 0 );

        });

        it('maintains the same ordering as the original group', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var originalResults = groupVisitsByDate.top(Infinity);
            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( originalResults[0].key );
            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[1].key ).toBe( originalResults[1].key );
            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[2].key ).toBe( originalResults[2].key );
            expect( results[2].key ).toBe( '2012-01-13' );

        });

        it('maintains the same values as the original group', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var originalResults = groupVisitsByDate.top(Infinity);
            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].value ).toBe( originalResults[0].value );
            expect( results[1].value ).toBe( originalResults[1].value );
            expect( results[2].value ).toBe( originalResults[2].value );

        });

        it('uses correct dates', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0]._debug.thisDayKey ).toBe( '2012-01-16' );
            expect( results[0]._debug.prevDayKey ).toBe( '2012-01-15' );

            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1]._debug.thisDayKey ).toBe( '2012-01-15' );
            expect( results[1]._debug.prevDayKey ).toBe( '2012-01-14' );

            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2]._debug.thisDayKey ).toBe( '2012-01-13' );
            expect( results[2]._debug.prevDayKey ).toBe( '2012-01-12' );

            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3]._debug.thisDayKey ).toBe( '2012-01-17' );
            expect( results[3]._debug.prevDayKey ).toBe( '2012-01-16' );

            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[5].key ).toBe( '2012-01-12' );

            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6]._debug.thisDayKey ).toBe( '2012-01-11' );
            expect( results[6]._debug.prevDayKey ).toBe( 'None' );

        });

        /**
         * mockUnorderedUniqueData();

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

        it('handles out of order dates', function() {

            mockUnorderedUniqueData();

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0].percentageChange ).toBe( 20 );
            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1].percentageChange ).toBe( 233.33333333333334 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].percentageChange ).toBe( 233.33333333333334 );

            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6]._debug.thisDayKey ).toBe( '2012-01-11' );
            expect( results[6]._debug.prevDayKey ).toBe( 'None' );

            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5]._debug.thisDayKey ).toBe( '2012-01-12' );
            expect( results[5]._debug.prevDayKey ).toBe( '2012-01-11' );

        });

        /**
         * mockUnorderedRedundantData();

         key: "2012-01-13"
         value: 17

         key: "2012-01-12"
         value: 15

         key: "2012-01-15"
         value: 10

         key: "2012-01-11"
         value: 5

         */

        it('handles redundant dates', function() {

            mockUnorderedRedundantData();

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-13' ); //5
            expect( results[0].percentageChange ).toBe( 13.333333333333334 );
            expect( results[1].key ).toBe( '2012-01-12' ); // 15
            expect( results[1].percentageChange ).toBe( 200 );
            expect( results[2].key ).toBe( '2012-01-15' ); // 17
            expect( results[2].percentageChange ).toBe( -41.17647058823529 );
            expect( results[3].key ).toBe( '2012-01-11' ); // 10
            expect( results[3].percentageChange ).toBe( 0 );

            expect( results[0].key ).toBe( '2012-01-13' );
            expect( results[0]._debug.thisDayKey ).toBe( '2012-01-13' );
            expect( results[0]._debug.prevDayKey ).toBe( '2012-01-12' );

            expect( results[1]._debug.thisDayKey ).toBe( '2012-01-12' );
            expect( results[1]._debug.prevDayKey ).toBe( '2012-01-11' );

            expect( results[2]._debug.thisDayKey ).toBe( '2012-01-15' );
            expect( results[2]._debug.prevDayKey ).toBe( '2012-01-13' );

            // 14 is missing

            expect( results[3]._debug.thisDayKey ).toBe( '2012-01-11' );
            expect( results[3]._debug.prevDayKey ).toBe( 'None' );

        });

    });


});