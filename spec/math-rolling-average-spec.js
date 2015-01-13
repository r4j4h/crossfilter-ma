describe('accumulateGroupForNDayMovingAverage', function() {

    var global,
        crossfilterMa;

    var setOfNumbers = [],
        crossfilterInstance,
        dimensionDate,
        dimensionDateForFiltering,
        dimensionVisitsForFiltering,
        groupVisitsByDate,
        groupVisitsByPlaceAndTerritoryByDate;

    /**
     * Rebuild crossfilter, dimension, and group with mock data.
     * @param {[{date: String, visits: Number}]} mockData
     */
    function rebuildMockCrossfilterWithMockData( mockData ) {

        crossfilterInstance = crossfilter( mockData );

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

    }

    /**
     * Mock ordered, unique test data
     */
    function mockOrderedUniqueData() {

        setOfNumbers = [
            { date: "2012-01-11", visits: 2  }, // 2 point  | 3 point
            { date: "2012-01-12", visits: 3  }, // 2.5      | null
            { date: "2012-01-13", visits: 10 }, // 6.5      | 5
            { date: "2012-01-14", visits: 3  }, // 6.5      | 5.333
            { date: "2012-01-15", visits: 10 }, // 6.5      | 7.666
            { date: "2012-01-16", visits: 12 }, // 11       | 8.333
            { date: "2012-01-17", visits: 7  }  // 9.5      | 9.666
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

    /**
     * Mock unordered, redundant data with custom grouping functions
     */
    function mockCustomKeyValueData() {

        setOfNumbers = [
            { date: "2012-01-11", visits: 2,  place: "A", territory: "A" },
            { date: "2012-01-12", visits: 3,  place: "B", territory: "A" },
            { date: "2012-01-13", visits: 10, place: "A", territory: "B" },
            { date: "2012-01-11", visits: 3,  place: "C", territory: "B" },
            { date: "2012-01-15", visits: 10, place: "A", territory: "A" },
            { date: "2012-01-12", visits: 12, place: "B", territory: "A" },
            { date: "2012-01-13", visits: 7,  place: "A", territory: "B" }
        ];

        rebuildMockCrossfilterWithMockData( setOfNumbers );

        groupVisitsByPlaceAndTerritoryByDate = dimensionDate.group().reduce(
            function ( p, v ) {
                p.totalVisits += v.visits;

                if ( p.places[ v.place ] ) {
                    p.places[ v.place ].visits += v.visits;
                } else {
                    p.places[ v.place ] = {
                        visits: v.visits
                    };
                }

                if ( p.territories[ v.territory ] ) {
                    p.territories[ v.territory ].visits += v.visits;
                } else {
                    p.territories[ v.territory ] = {
                        visits: v.visits
                    };
                }
                return p;
            },
            function ( p, v ) {
                p.totalVisits -= v.visits;

                if ( p.places[ v.place ] ) {
                    p.places[ v.place ].visits -= v.visits;
                } else {
                    delete p.places[ v.place ];
                }

                if ( p.territories[ v.territory ] ) {
                    p.territories[ v.territory ].visits -= v.visits;
                } else {
                    delete p.territories[ v.territory ];
                }
                return p;
            },
            function () {
                return {
                    totalVisits: 0,
                    places: {},
                    territories: {}
                };
            }
        );

    }

    beforeEach(function() {
        global = (function() { return this; })();
        crossfilterMa = global['crossfilter-ma'];

        mockOrderedUniqueData();
    });

    afterEach(function() {
        setOfNumbers = [];
        crossfilterInstance = null;
        dimensionDate = null;
        dimensionDateForFiltering = null;
        dimensionVisitsForFiltering = null;
        groupVisitsByDate = null;
        groupVisitsByPlaceAndTerritoryByDate = null;

        global = null;
        crossfilterMa = null;
    });

    describe('constructor', function() {

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

        it('allows configuring ndays', function() {

            var firstRollingAverageFakeGroup;

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, undefined );

            expect( firstRollingAverageFakeGroup.ndays() ).toBe( crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES );
            expect( firstRollingAverageFakeGroup.ndays() ).not.toBe( 16 );

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, 3 );

            expect( firstRollingAverageFakeGroup.ndays() ).not.toBe( crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES );
            expect( firstRollingAverageFakeGroup.ndays() ).toBe( 3 );

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, 16 );

            expect( firstRollingAverageFakeGroup.ndays() ).not.toBe( crossfilterMa.constants.DEFAULT_MOVING_AVERAGE_NODES );
            expect( firstRollingAverageFakeGroup.ndays() ).toBe( 16 );

        });

        it('allows configuring rolldown flag', function() {

            var firstRollingAverageFakeGroup;

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, undefined, undefined );

            expect( firstRollingAverageFakeGroup.rolldown() ).toBeFalsy();

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, undefined, false );

            expect( firstRollingAverageFakeGroup.rolldown() ).toBeFalsy();

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, undefined, true );

            expect( firstRollingAverageFakeGroup.rolldown() ).toBeTruthy();

        });

        it('allows configuring debug flag', function() {

            var firstRollingAverageFakeGroup;

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, undefined, undefined, undefined );

            expect( firstRollingAverageFakeGroup._debug() ).toBeFalsy();

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, undefined, undefined, false );

            expect( firstRollingAverageFakeGroup._debug() ).toBeFalsy();

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( { all: function() {} }, undefined, undefined, true );

            expect( firstRollingAverageFakeGroup._debug() ).toBeTruthy();

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


    describe('rolldown()', function() {

        describe('when given no parameters', function() {

            it('returns the current state of the rolldown flag', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
                expect( percentageChangeFakeGroup.rolldown() ).toBeFalsy();

            });

        });

        describe('when given parameters', function() {

            it('takes boolean coerce-able parameters as the new state of the rolldown flag', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
                percentageChangeFakeGroup.rolldown( true );
                expect( percentageChangeFakeGroup.rolldown() ).toBeTruthy();

            });

        });

        it('defaults to off', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            expect( percentageChangeFakeGroup.rolldown() ).toBeFalsy();

        });

    });


    describe('_debug()', function() {

        describe('when given no parameters', function() {

            it('returns the current state of the debug flag', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
                expect( percentageChangeFakeGroup._debug() ).toBeFalsy();

            });

        });

        describe('when given parameters', function() {

            it('takes boolean coerce-able parameters as the new state of the debug flag', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
                percentageChangeFakeGroup._debug( true );
                expect( percentageChangeFakeGroup._debug() ).toBeTruthy();

            });

        });

        it('defaults to off', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            expect( percentageChangeFakeGroup._debug() ).toBeFalsy();

        });

    });


    describe('key accessors', function() {

        it('_defaultKeyAccessor() returns default key accessor', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            expect( percentageChangeFakeGroup._defaultKeyAccessor() ).toEqual( jasmine.any( Function ) );

        });

        describe('keyAccessor()', function() {

            it('returns current keyAccessor', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
                expect( percentageChangeFakeGroup.keyAccessor() ).toEqual( jasmine.any( Function ) );

            });

            it('allows configuring keyAccessor', function() {

                var myAccessor = jasmine.createSpy('myAccessor'),
                    origAccessor;
                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
                origAccessor = percentageChangeFakeGroup.keyAccessor();

                percentageChangeFakeGroup.keyAccessor( myAccessor );

                expect( myAccessor ).not.toHaveBeenCalled();

                expect( percentageChangeFakeGroup.keyAccessor() ).toBe(myAccessor);
                expect( percentageChangeFakeGroup.keyAccessor() ).not.toBe(origAccessor);

                percentageChangeFakeGroup.all();

                expect( myAccessor ).toHaveBeenCalled();

            });

        });

    });

    describe('value accessors', function() {

        it('_defaultValueAccessor() returns default value accessor', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            expect( percentageChangeFakeGroup._defaultValueAccessor() ).toEqual( jasmine.any(Function) );

        });

        describe('valueAccessor()', function() {

            it('returns current valueAccessor', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
                expect( percentageChangeFakeGroup.valueAccessor() ).toEqual(jasmine.any(Function));

            });

            it('allows configuring valueAccessor', function() {

                var myAccessor = function() {},
                    origAccessor;
                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
                origAccessor = percentageChangeFakeGroup.valueAccessor();

                percentageChangeFakeGroup.valueAccessor( myAccessor );

                expect( percentageChangeFakeGroup.valueAccessor() ).toBe(myAccessor);
                expect( percentageChangeFakeGroup.valueAccessor() ).not.toBe(origAccessor);

            });

        });

    });


    describe('all()', function() {

        it('calculate 2 point rolling average over a set of numbers', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 2 );
            rollingAverageFakeGroup._debug( true );

            var results = rollingAverageFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 0 );
            expect( results[0]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 2.5 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 2 );
            expect( results[1]._debug.datumsUsed[0].key ).toBe( '2012-01-11' );
            expect( results[1]._debug.datumsUsed[1].key ).toBe( '2012-01-12' );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 6.5 );
            expect( results[2]._debug.datumsUsed.length ).toBe( 2 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBe( 6.5 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 2 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBe( 6.5 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBe( 11 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBe( 9.5 );

        });

        it('calculate 3 point rolling average over set of numbers', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );
            rollingAverageFakeGroup._debug( true );

            var results = rollingAverageFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 0 );
            expect( results[0]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 0 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 5 );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBeCloseTo( 5.333333333333333 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBeCloseTo( 7.666666666666667 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBeCloseTo( 8.333333333333334 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBeCloseTo( 9.666666666666666 );

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
            rollingAverageFakeGroup._debug( true );

            var results = rollingAverageFakeGroup.all();

            expect( results[0]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[0]._debug.datumsUsed[ 0 ].key ).toBe( results[ 0 ].key );
            expect( results[1]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[1]._debug.datumsUsed[ 0 ].key ).toBe( results[ 1 ].key );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2]._debug.datumsUsed[ 0 ].key ).toBe( results[ 0 ].key );
            expect( results[2]._debug.datumsUsed[ 0 ].key ).toBe( '2012-01-11' );
            expect( results[2]._debug.datumsUsed[ 1 ].key ).toBe( results[ 1 ].key );
            expect( results[2]._debug.datumsUsed[ 1 ].key ).toBe( '2012-01-12' );
            expect( results[2]._debug.datumsUsed[ 2 ].key ).toBe( results[ 2 ].key );
            expect( results[2]._debug.datumsUsed[ 2 ].key ).toBe( '2012-01-13' );

        });


        it('supports filtering in crossfilter', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );
            percentageChangeFakeGroup._debug( true );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 0 );
            expect( results[0]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 0 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 5 );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBeCloseTo( 5.333333333333333 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBeCloseTo( 7.666666666666667 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBeCloseTo( 8.333333333333334 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBeCloseTo( 9.666666666666666 );

            dimensionVisitsForFiltering.filterRange( [ 3,11 ] );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 0 );
            expect( results[0]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 0 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBeCloseTo( 4.333333333333333 );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBeCloseTo( 5.333333333333333 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBeCloseTo( 7.666666666666667 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBeCloseTo( 4.333333333333333 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBeCloseTo( 5.666666666666667 );

        });

        it('only returns debug information when debug flag is engaged', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0]._debug ).not.toBeDefined();

            percentageChangeFakeGroup._debug( true );

            var results = percentageChangeFakeGroup.all();

            expect( results[0]._debug ).toBeDefined();

        });

        it('supports rolldown', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );
            rollingAverageFakeGroup._debug( true );
            rollingAverageFakeGroup.rolldown( false );

            var results = rollingAverageFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 0 );
            expect( results[0]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 0 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 5 );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBeCloseTo( 5.333333333333333 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBeCloseTo( 7.666666666666667 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBeCloseTo( 8.333333333333334 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBeCloseTo( 9.666666666666666 );


            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );
            rollingAverageFakeGroup._debug( true );
            rollingAverageFakeGroup.rolldown( true );

            var results = rollingAverageFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].rollingAverage ).toBe( 2 );
            expect( results[0]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].rollingAverage ).toBe( 2.5 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 2 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 5 );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-14' );
            expect( results[3].rollingAverage ).toBeCloseTo( 5.333333333333333 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-15' );
            expect( results[4].rollingAverage ).toBeCloseTo( 7.666666666666667 );
            expect( results[5].key ).toBe( '2012-01-16' );
            expect( results[5].rollingAverage ).toBeCloseTo( 8.333333333333334 );
            expect( results[6].key ).toBe( '2012-01-17' );
            expect( results[6].rollingAverage ).toBeCloseTo( 9.666666666666666 );
        });

        it('uses custom key accessor', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var origKey = rollingAverageFakeGroup.keyAccessor();
            var mySpy = jasmine.createSpy(origKey ).and.callThrough();
            rollingAverageFakeGroup.keyAccessor( mySpy );

            rollingAverageFakeGroup.all();

            expect( mySpy ).toHaveBeenCalled();

        });

        it('uses custom value accessor', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var origKey = rollingAverageFakeGroup.valueAccessor();
            var mySpy = jasmine.createSpy(origKey ).and.callThrough();
            rollingAverageFakeGroup.valueAccessor( mySpy );

            rollingAverageFakeGroup.all();

            expect( mySpy ).toHaveBeenCalled();

        });



    });


    describe('top()', function() {

        it('calculate 2 point rolling average over a set of numbers', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );
            rollingAverageFakeGroup._debug( true );

            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0].rollingAverage ).toBe( 11 );
            expect( results[0]._debug.datumsUsed.length ).toBe( 2 );
            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1].rollingAverage ).toBe( 6.5 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 2 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 6.5 );
            expect( results[2]._debug.datumsUsed.length ).toBe( 2 );
            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3].rollingAverage ).toBe( 9.5 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 2 );
            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[4].rollingAverage ).toBe( 6.5 );
            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5].rollingAverage ).toBe( 2.5 );
            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6].rollingAverage ).toBe( 0 );
            expect( results[6]._debug.datumsUsed.length ).toBe( 1 );

        });

        it('calculate 3 point rolling average over set of numbers', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );
            rollingAverageFakeGroup._debug( true );

            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0].rollingAverage ).toBeCloseTo( 8.333333333333334 );
            expect( results[0]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1].rollingAverage ).toBeCloseTo( 7.666666666666667 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].rollingAverage ).toBe( 5 );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3].rollingAverage ).toBeCloseTo( 9.666666666666666 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[4].rollingAverage ).toBeCloseTo( 5.333333333333333 );
            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5].rollingAverage ).toBe( 0 );
            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6].rollingAverage ).toBe( 0 );
            expect( results[6]._debug.datumsUsed.length ).toBe( 1 );

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
            rollingAverageFakeGroup._debug( true );

            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[0]._debug.datumsUsed[ 0 ].key ).toBe( '2012-01-14' );
            expect( results[0]._debug.datumsUsed[ 1 ].key ).toBe( '2012-01-15' );
            expect( results[0]._debug.datumsUsed[ 2 ].key ).toBe( '2012-01-16' );

            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[1]._debug.datumsUsed[ 0 ].key ).toBe( '2012-01-13' );
            expect( results[1]._debug.datumsUsed[ 1 ].key ).toBe( '2012-01-14' );
            expect( results[1]._debug.datumsUsed[ 2 ].key ).toBe( '2012-01-15' );

            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[2]._debug.datumsUsed[ 0 ].key ).toBe( '2012-01-11' );
            expect( results[2]._debug.datumsUsed[ 1 ].key ).toBe( '2012-01-12' );
            expect( results[2]._debug.datumsUsed[ 2 ].key ).toBe( '2012-01-13' );

            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );

            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[4]._debug.datumsUsed.length ).toBe( 3 );

            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[5]._debug.datumsUsed[ 0 ].key ).toBe( '2012-01-12' );

            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6]._debug.datumsUsed.length ).toBe( 1 );
            expect( results[6]._debug.datumsUsed[ 0 ].key ).toBe( '2012-01-11' );

        });

        it('only returns debug information when debug flag is engaged', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate );

            var results1 = percentageChangeFakeGroup.top(Infinity);

            expect( results1[0]._debug ).not.toBeDefined();

            percentageChangeFakeGroup._debug( true );

            var results2 = percentageChangeFakeGroup.top(Infinity);

            expect( results2[0]._debug ).toBeDefined();

        });

        it('supports rolldown', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );
            rollingAverageFakeGroup._debug( true );
            rollingAverageFakeGroup.rolldown( false );

            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3].rollingAverage ).toBeCloseTo( 9.666666666666666 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[4].rollingAverage ).toBeCloseTo( 5.333333333333333 );
            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5].rollingAverage ).toBe( 0 );
            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6].rollingAverage ).toBe( 0 );
            expect( results[6]._debug.datumsUsed.length ).toBe( 1 );

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );
            rollingAverageFakeGroup._debug( true );
            rollingAverageFakeGroup.rolldown( true );

            var results = rollingAverageFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[1]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[3].key ).toBe( '2012-01-17' );
            expect( results[3].rollingAverage ).toBeCloseTo( 9.666666666666666 );
            expect( results[3]._debug.datumsUsed.length ).toBe( 3 );
            expect( results[4].key ).toBe( '2012-01-14' );
            expect( results[4].rollingAverage ).toBeCloseTo( 5.333333333333333 );
            expect( results[5].key ).toBe( '2012-01-12' );
            expect( results[5].rollingAverage ).toBe( 2.5 );
            expect( results[6].key ).toBe( '2012-01-11' );
            expect( results[6].rollingAverage ).toBe( 2 );
            expect( results[6]._debug.datumsUsed.length ).toBe( 1 );

        });

        it('uses custom key accessor', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var origKey = rollingAverageFakeGroup.keyAccessor();
            var mySpy = jasmine.createSpy(origKey ).and.callThrough();
            rollingAverageFakeGroup.keyAccessor( mySpy );

            rollingAverageFakeGroup.top(Infinity);

            expect( mySpy ).toHaveBeenCalled();

        });

        it('uses custom value accessor', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( groupVisitsByDate, 3 );

            var origKey = rollingAverageFakeGroup.valueAccessor();
            var mySpy = jasmine.createSpy(origKey ).and.callThrough();
            rollingAverageFakeGroup.valueAccessor( mySpy );

            rollingAverageFakeGroup.top(Infinity);

            expect( mySpy ).toHaveBeenCalled();

        });

    });


});