describe('accumulateGroupForPercentageChange', function() {

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

        groupVisitsByDate = dimensionDate.group().reduceSum(function(d) {
            return d.visits;
        });

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

    /**
     * Mock unordered, redundant data with custom grouping functions
     */
    function mockCustomKeyValueData() {

        setOfNumbers = [
            { date: "2012-01-11", visits: 2,  place: "A", territory: "A" },
            { date: "2012-01-12", visits: 3,  place: "B", territory: "A" },
            { date: "2012-01-13", visits: 10, place: "A", territory: "B" },
            { date: "2012-01-11", visits: 3,  place: "C", territory: "B" },
            { date: "2012-01-11", visits: 1,  place: "A", territory: "A" },
            { date: "2012-01-15", visits: 10, place: "A", territory: "A" },
            { date: "2012-01-12", visits: 12, place: "B", territory: "A" },
            { date: "2012-01-13", visits: 7,  place: "A", territory: "B" }
        ];

        rebuildMockCrossfilterWithMockData( setOfNumbers );

        var dimensionPlaces = crossfilterInstance.dimension(function (d) {
            return d.place
        });
        var dimensionTerritories = crossfilterInstance.dimension(function (d) {
            return d.territory
        });
        var knownPlaces = dimensionPlaces.group().all().map( function(d) { return d.key; } );
        var knownTerritories = dimensionTerritories.group().all().map( function(d) { return d.key; } );

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
                var obj = {
                    totalVisits: 0,
                    places     : {},
                    territories: {}
                };

                // Make sure each place is represented, with at least 0
                var t = knownPlaces.length,
                    i = -1;
                while ( ++i < t ) {
                    obj.places[ knownPlaces[i] ] = {
                        visits: 0
                    };
                }
                // Make sure each territory is represented, with at least 0
                var t = knownTerritories.length,
                    i = -1;
                while ( ++i < t ) {
                    obj.territories[ knownTerritories[i] ] = {
                        visits: 0
                    };
                }

                return obj;
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

        it('allows configuring debug flag', function() {

            var firstRollingAverageFakeGroup;

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( { all: function() {} }, undefined );

            expect( firstRollingAverageFakeGroup._debug() ).toBeFalsy();

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( { all: function() {} }, false );

            expect( firstRollingAverageFakeGroup._debug() ).toBeFalsy();

            firstRollingAverageFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( { all: function() {} }, true );

            expect( firstRollingAverageFakeGroup._debug() ).toBeTruthy();

        });

    });




    describe('_debug()', function() {

        describe('when given no parameters', function() {

            it('returns the current state of the debug flag', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

                expect( percentageChangeFakeGroup._debug() ).toBeFalsy();

            });

        });

        describe('when given parameters', function() {

            it('takes boolean coerce-able parameters as the new state of the debug flag', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
                percentageChangeFakeGroup._debug( true );
                expect( percentageChangeFakeGroup._debug() ).toBeTruthy();

            });

        });

        it('defaults to off', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
            expect( percentageChangeFakeGroup._debug() ).toBeFalsy();

        });

    });

    describe('key accessors', function() {

        it('_defaultKeyAccessor() returns default key accessor', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
            expect( percentageChangeFakeGroup._defaultKeyAccessor() ).toEqual( jasmine.any( Function ) );

        });

        describe('keyAccessor()', function() {

            it('returns current keyAccessor', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
                expect( percentageChangeFakeGroup.keyAccessor() ).toEqual( jasmine.any( Function ) );

            });

            it('allows configuring keyAccessor', function() {

                var myAccessor = jasmine.createSpy('myAccessor'),
                    origAccessor;
                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
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

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
            expect( percentageChangeFakeGroup._defaultValueAccessor() ).toEqual( jasmine.any( Function ) );

        });

        describe('valueAccessor()', function() {

            it('returns current valueAccessor', function() {

                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
                expect( percentageChangeFakeGroup.valueAccessor() ).toEqual( jasmine.any( Function ) );

            });

            it('allows configuring valueAccessor', function() {

                var myAccessor = jasmine.createSpy('myAccessor'),
                    origAccessor;
                var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
                origAccessor = percentageChangeFakeGroup.valueAccessor();

                percentageChangeFakeGroup.valueAccessor( myAccessor );

                expect( myAccessor ).not.toHaveBeenCalled();

                expect( percentageChangeFakeGroup.valueAccessor() ).toBe(myAccessor);
                expect( percentageChangeFakeGroup.valueAccessor() ).not.toBe(origAccessor);

                percentageChangeFakeGroup.all();

                expect( myAccessor ).toHaveBeenCalled();

            });

        });

    });


    describe('all()', function() {

        it('calculates percentage change for a set of numbers', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].percentageChange ).toBe( 0 );
            expect( results[1].percentageChange ).toBe( 50 );
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBe( -70 );
            expect( results[4].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[5].percentageChange ).toBe( 20 );
            expect( results[6].percentageChange ).toBeCloseTo( -41.66666666666667 );

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
            percentageChangeFakeGroup._debug( true );

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
            percentageChangeFakeGroup._debug( true );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0].percentageChange ).toBe( 0 );
            expect( results[1].key ).toBe( '2012-01-12' );
            expect( results[1].percentageChange ).toBeCloseTo( 50 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );

            expect( results[0].key ).toBe( '2012-01-11' );
            expect( results[0]._debug.thisDayKey ).toBe( '2012-01-11' );
            expect( results[0]._debug.prevDayKey ).toBe( 'None' );

            expect( results[1]._debug.thisDayKey ).toBe( '2012-01-12' );
            expect( results[1]._debug.prevDayKey ).toBe( '2012-01-11' );

        });

        it('handles redundant dates', function() {

            mockUnorderedRedundantData();

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
            percentageChangeFakeGroup._debug( true );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].key ).toBe( '2012-01-11' ); //5
            expect( results[0].percentageChange ).toBe( 0 );
            expect( results[1].key ).toBe( '2012-01-12' ); // 15
            expect( results[1].percentageChange ).toBeCloseTo( 200 );
            expect( results[2].key ).toBe( '2012-01-13' ); // 17
            expect( results[2].percentageChange ).toBeCloseTo( 13.333333333333334 );
            expect( results[3].key ).toBe( '2012-01-15' ); // 10
            expect( results[3].percentageChange ).toBeCloseTo( -41.17647058823529 );

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


        it('supports filtering in crossfilter', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].percentageChange ).toBe( 0 );
            expect( results[1].percentageChange ).toBeCloseTo( 50 );
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBeCloseTo( -70 );
            expect( results[4].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[5].percentageChange ).toBeCloseTo( 20 );
            expect( results[6].percentageChange ).toBeCloseTo( -41.66666666666667 );

            dimensionVisitsForFiltering.filterRange( [ 3,11 ] );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].percentageChange ).toBe( 0 );
            expect( results[1].percentageChange ).toBe( Infinity );
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBeCloseTo( -70 );
            expect( results[4].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[5].percentageChange ).toBeCloseTo( -100 );
            expect( results[6].percentageChange ).toBe( Infinity );

        });

        it('only returns debug information when debug flag is engaged', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0]._debug ).not.toBeDefined();

            percentageChangeFakeGroup._debug( true );

            var results = percentageChangeFakeGroup.all();

            expect( results[0]._debug ).toBeDefined();

        });


        it('uses custom key accessor', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var origKey = rollingAverageFakeGroup.keyAccessor();
            var mySpy = jasmine.createSpy(origKey ).and.callThrough();
            rollingAverageFakeGroup.keyAccessor( mySpy );

            rollingAverageFakeGroup.all();

            expect( mySpy ).toHaveBeenCalled();

        });

        it('uses custom value accessor', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var origKey = rollingAverageFakeGroup.valueAccessor();
            var mySpy = jasmine.createSpy(origKey ).and.callThrough();
            rollingAverageFakeGroup.valueAccessor( mySpy );

            rollingAverageFakeGroup.all();

            expect( mySpy ).toHaveBeenCalled();

        });

        describe('works with multiple dimensions', function() {

            var percentageChangeGroupVisitsByDate;

            beforeEach(function() {
                mockCustomKeyValueData();
                // Using normal grouping
                percentageChangeGroupVisitsByDate = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
                percentageChangeGroupVisitsByDate._debug(true);

            });

            afterEach(function() {
                percentageChangeGroupVisitsByDate = null;
            });

            it('can get percent change of place A using reduceSum group by filtering on a place dimension', function() {

                var dimensionPlaces = crossfilterInstance.dimension(function (d) {
                    return d.place
                });

                dimensionPlaces.filter("A");

                var resultsAll = percentageChangeGroupVisitsByDate.all();

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 0 ]._debug.prevDayKey ).toBe( "None" );
                expect( resultsAll[ 0 ]._debug.thisDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ]._debug.prevDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ]._debug.thisDayKey ).toBe( "2012-01-12" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-15" );

                expect( resultsAll[ 0 ].value ).toBe( 3 );
                expect( resultsAll[ 1 ].value ).toBe( 0 );
                expect( resultsAll[ 2 ].value ).toBe( 17 );
                expect( resultsAll[ 3 ].value ).toBe( 10 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );

            });

            it('can get percent change of territory A using reduceSum group by filtering on a place dimension', function() {

                var dimensionTerritories = crossfilterInstance.dimension(function (d) {
                    return d.territory;
                });

                dimensionTerritories.filter("A");

                var resultsAll = percentageChangeGroupVisitsByDate.all();

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 0 ]._debug.prevDayKey ).toBe( "None" );
                expect( resultsAll[ 0 ]._debug.thisDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ]._debug.prevDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ]._debug.thisDayKey ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-15" );

                expect( resultsAll[ 0 ].value ).toBe( 3 );
                expect( resultsAll[ 1 ].value ).toBe( 15 );
                expect( resultsAll[ 2 ].value ).toBe( 0 );
                expect( resultsAll[ 3 ].value ).toBe( 10 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( 400 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( Infinity );

            });


        });


        describe('works with custom groupings', function() {

            var percentageChangeGroupVisitsByPlaceAndTerritoryByDate;

            beforeEach(function() {
                mockCustomKeyValueData();
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByPlaceAndTerritoryByDate );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate._debug(true);

            });

            afterEach(function() {
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate = null;
            });

            it('maintains original custom value', function() {

                var resultsAll;
                var all = groupVisitsByPlaceAndTerritoryByDate.all();
                resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( all[ 0 ].key ).toBe( resultsAll[ 0 ].key );
                expect( all[ 0 ].value ).toBe( resultsAll[ 0 ].value );
                expect( all[ 2 ].key ).toBe( resultsAll[ 2 ].key );
                expect( all[ 2 ].value ).toBe( resultsAll[ 2 ].value );
                expect( resultsAll[ 2 ].value ).toEqual( {
                    totalVisits: 17,
                    places: {
                        A: {
                            visits: 17
                        },
                        B: {
                            visits: 0
                        },
                        C: {
                            visits: 0
                        }
                    },
                    territories: {
                        A: {
                            visits: 0
                        },
                        B: {
                            visits: 17
                        }
                    }
                } );

            });

            it('adds percentage changed', function() {

                var all = groupVisitsByPlaceAndTerritoryByDate.all();
                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( all[ 0 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 0 ].percentageChange ).toBeDefined();
            });

            it('allows getting the % change of the total visits with a custom valueAccessor', function() {

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 0 ].percentageChange ).not.toBe( 1 );
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).not.toBe( 200 );
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).not.toBe( 13.33 );
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).not.toBe( 41.18 );

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.totalVisits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.totalVisits; } );

                resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( 150 );
                expect( resultsAll[ 2 ].percentageChange ).toBeCloseTo( 13.33 );
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );

            });

            it('allows getting the % change of Place A', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.value.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 0 ]._debug.prevDayKey ).toBe( "None" );
                expect( resultsAll[ 0 ]._debug.thisDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ]._debug.prevDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ]._debug.thisDayKey ).toBe( "2012-01-12" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-15" );

                expect( resultsAll[ 0 ].value.places.A.visits ).toBe( 3 );
                expect( resultsAll[ 1 ].value.places.A.visits ).toBe( 0 );
                expect( resultsAll[ 2 ].value.places.A.visits ).toBe( 17 );
                expect( resultsAll[ 3 ].value.places.A.visits ).toBe( 10 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );

            });

            it('allows getting the % change of Place B', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.B.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( 0 );

            });

            xit('allows getting the % change of each place', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 1 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 2 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 3 ].percentageChange ).not.toBeDefined();

                expect( resultsAll[ 0 ].value.places.A.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.places.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].value.places.A.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].value.places.A.percentageChange ).toBeCloseTo( -41.18 );

                expect( resultsAll[ 0 ].value.places.B.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.places.B.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 2 ].value.places.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].value.places.B.percentageChange ).toBe( 0 );

            });

            it('allows getting the % change of territory A', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.territories.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 0 ]._debug.prevDayKey ).toBe( "None" );
                expect( resultsAll[ 0 ]._debug.thisDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ]._debug.prevDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ]._debug.thisDayKey ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-15" );

                expect( resultsAll[ 0 ].value.territories.A.visits ).toBe( 3 );
                expect( resultsAll[ 1 ].value.territories.A.visits ).toBe( 15 );
                expect( resultsAll[ 2 ].value.territories.A.visits ).toBe( 0 );
                expect( resultsAll[ 3 ].value.territories.A.visits ).toBe( 10 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( 400 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( Infinity );

            });

            it('allows getting the % change of territory B', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.territories.B.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            xit('allows getting the % change of each territory', function() {

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 1 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 2 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 3 ].percentageChange ).not.toBeDefined();

                expect( resultsAll[ 0 ].value.territories.A.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.territories.A.percentageChange ).toBe( 650 );
                expect( resultsAll[ 2 ].value.territories.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].value.territories.A.percentageChange ).toBe( Infinity );

                expect( resultsAll[ 0 ].value.territories.B.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.territories.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].value.territories.B.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].value.territories.B.percentageChange ).toBe( -100 );

            });

            xit('allows getting the % change of each place and territory and total', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.totalVisits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( 200 );
                expect( resultsAll[ 2 ].percentageChange ).toBeCloseTo( 13.33 );
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );

                expect( resultsAll[ 0 ].value.places.A.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.places.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].value.places.A.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].value.places.A.percentageChange ).toBeCloseTo( -41.18 );

                expect( resultsAll[ 0 ].value.places.B.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.places.B.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 2 ].value.places.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].value.places.B.percentageChange ).toBe( 0 );

                expect( resultsAll[ 0 ].value.territories.A.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.territories.A.percentageChange ).toBe( 650 );
                expect( resultsAll[ 2 ].value.territories.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].value.territories.A.percentageChange ).toBe( Infinity );

                expect( resultsAll[ 0 ].value.territories.B.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.territories.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].value.territories.B.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].value.territories.B.percentageChange ).toBe( -100 );
                
            });

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
            expect( results[1].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBeCloseTo( -41.66666666666667 );
            expect( results[4].percentageChange ).toBeCloseTo( -70 );
            expect( results[5].percentageChange ).toBeCloseTo( 50 );
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
            percentageChangeFakeGroup._debug( true );

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
            percentageChangeFakeGroup._debug( true );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-16' );
            expect( results[0].percentageChange ).toBe( 20 );
            expect( results[1].key ).toBe( '2012-01-15' );
            expect( results[1].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[2].key ).toBe( '2012-01-13' );
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );

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
            percentageChangeFakeGroup._debug( true );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].key ).toBe( '2012-01-13' ); //5
            expect( results[0].percentageChange ).toBeCloseTo( 13.333333333333334 );
            expect( results[1].key ).toBe( '2012-01-12' ); // 15
            expect( results[1].percentageChange ).toBe( 200 );
            expect( results[2].key ).toBe( '2012-01-15' ); // 17
            expect( results[2].percentageChange ).toBeCloseTo( -41.17647058823529 );
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


        it('supports filtering in crossfilter', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].percentageChange ).toBe( 20 );
            expect( results[1].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBeCloseTo( -41.66666666666667 );
            expect( results[4].percentageChange ).toBe( -70 );
            expect( results[5].percentageChange ).toBe( 50 );
            expect( results[6].percentageChange ).toBe( 0 );

            dimensionVisitsForFiltering.filterRange( [ 3,11 ] );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[1].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[2].percentageChange ).toBe( Infinity );
            expect( results[3].percentageChange ).toBe( -70 );
            expect( results[4].percentageChange ).toBe( Infinity );
            expect( results[5].percentageChange ).toBe( -100 );
            expect( results[6].percentageChange ).toBe( 0 );

        });

        it('only returns debug information when debug flag is engaged', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results1 = percentageChangeFakeGroup.top(Infinity);

            expect( results1[0]._debug ).not.toBeDefined();

            percentageChangeFakeGroup._debug( true );

            var results2 = percentageChangeFakeGroup.top(Infinity);

            expect( results2[0]._debug ).toBeDefined();

        });


        it('uses custom key accessor', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var origKey = rollingAverageFakeGroup.keyAccessor();
            var mySpy = jasmine.createSpy(origKey ).and.callThrough();
            rollingAverageFakeGroup.keyAccessor( mySpy );

            rollingAverageFakeGroup.top(Infinity);

            expect( mySpy ).toHaveBeenCalled();

        });

        it('uses custom value accessor', function() {

            var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var origKey = rollingAverageFakeGroup.valueAccessor();
            var mySpy = jasmine.createSpy(origKey ).and.callThrough();
            rollingAverageFakeGroup.valueAccessor( mySpy );

            rollingAverageFakeGroup.top(Infinity);

            expect( mySpy ).toHaveBeenCalled();

        });

        describe('works with multiple dimensions', function() {

            var percentageChangeGroupVisitsByDate;

            beforeEach(function() {
                mockCustomKeyValueData();
                // Using normal grouping
                percentageChangeGroupVisitsByDate = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
                percentageChangeGroupVisitsByDate._debug(true);

            });

            afterEach(function() {
                percentageChangeGroupVisitsByDate = null;
            });

            it('can get percent change of place A using reduceSum group by filtering on a place dimension', function() {

                var dimensionPlaces = crossfilterInstance.dimension(function (d) {
                    return d.place
                });

                dimensionPlaces.filter("A");

                var resultsAll = percentageChangeGroupVisitsByDate.top( Infinity );

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-15" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-12" );

                expect( resultsAll[ 0 ].value ).toBe( 17 );
                expect( resultsAll[ 1 ].value ).toBe( 10 );
                expect( resultsAll[ 2 ].value ).toBe( 3 );
                expect( resultsAll[ 3 ].value ).toBe( 0 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 1 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            it('can get percent change of territory A using reduceSum group by filtering on a place dimension', function() {

                var dimensionTerritories = crossfilterInstance.dimension(function (d) {
                    return d.territory;
                });

                dimensionTerritories.filter("A");

                var resultsAll = percentageChangeGroupVisitsByDate.top( Infinity );

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 0 ]._debug.prevDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 0 ]._debug.thisDayKey ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-15" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-13" );

                expect( resultsAll[ 0 ].value ).toBe( 15 );
                expect( resultsAll[ 1 ].value ).toBe( 10 );
                expect( resultsAll[ 2 ].value ).toBe( 3 );
                expect( resultsAll[ 3 ].value ).toBe( 0 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( 400 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 2 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });


        });

        describe('works with custom groupings', function() {

            var percentageChangeGroupVisitsByPlaceAndTerritoryByDate;

            beforeEach(function() {
                mockCustomKeyValueData();
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByPlaceAndTerritoryByDate );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate._debug(true);

            });

            afterEach(function() {
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate = null;
            });

            it('maintains original custom value', function() {

                var resultsAll;
                var all = groupVisitsByPlaceAndTerritoryByDate.top(Infinity);
                resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( all[ 0 ].key ).toBe( resultsAll[ 0 ].key );
                expect( all[ 0 ].value ).toBe( resultsAll[ 0 ].value );
                expect( all[ 2 ].key ).toBe( resultsAll[ 2 ].key );
                expect( all[ 2 ].value ).toBe( resultsAll[ 2 ].value );
                expect( resultsAll[ 1 ].value ).toEqual( {
                    totalVisits: 17,
                    places: {
                        A: {
                            visits: 17
                        },
                        B: {
                            visits: 0
                        },
                        C: {
                            visits: 0
                        }
                    },
                    territories: {
                        A: {
                            visits: 0
                        },
                        B: {
                            visits: 17
                        }
                    }
                } );

            });

            it('adds percentage changed', function() {

                var all = groupVisitsByPlaceAndTerritoryByDate.top(Infinity);
                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( all[ 0 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 0 ].percentageChange ).toBeDefined();
            });

            it('allows getting the % change of the total visits with a custom valueAccessor', function() {

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].percentageChange ).not.toBe( 1 );
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).not.toBe( 200 );
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).not.toBe( 13.33 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].percentageChange ).not.toBe( 41.18 );

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.totalVisits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.totalVisits; } );

                resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-15" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-11" );

                expect( resultsAll[ 0 ].value.totalVisits ).toBe( 17 );
                expect( resultsAll[ 1 ].value.totalVisits ).toBe( 15 );
                expect( resultsAll[ 2 ].value.totalVisits ).toBe( 10 );
                expect( resultsAll[ 3 ].value.totalVisits ).toBe( 6 );

                expect( resultsAll[ 0 ].percentageChange ).toBeCloseTo( 13.33 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( 150 );
                expect( resultsAll[ 2 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( 0 );

            });

            it('allows getting the % change of Place A with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-15" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-12" );

                expect( resultsAll[ 0 ].value.places.A.visits ).toBe( 17 );
                expect( resultsAll[ 1 ].value.places.A.visits ).toBe( 10 );
                expect( resultsAll[ 2 ].value.places.A.visits ).toBe( 3 );
                expect( resultsAll[ 3 ].value.places.A.visits ).toBe( 0 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 1 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            it('allows getting the % change of Place B with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.B.visits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.B.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( 0 );

            });

            xit('allows getting the % change of each place', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 1 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 2 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 3 ].percentageChange ).not.toBeDefined();

                expect( resultsAll[ 0 ].value.places.A.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 1 ].value.places.A.percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 2 ].value.places.A.percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].value.places.A.percentageChange ).toBe( -100 );

                expect( resultsAll[ 0 ].value.places.B.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 1 ].value.places.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].value.places.B.percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].value.places.B.percentageChange ).toBe( 0 );

            });

            it('allows getting the % change of territory A with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.territories.A.visits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.territories.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 0 ]._debug.prevDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 0 ]._debug.thisDayKey ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-15" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-13" );

                expect( resultsAll[ 0 ].value.territories.A.visits ).toBe( 15 );
                expect( resultsAll[ 1 ].value.territories.A.visits ).toBe( 10 );
                expect( resultsAll[ 2 ].value.territories.A.visits ).toBe( 3 );
                expect( resultsAll[ 3 ].value.territories.A.visits ).toBe( 0 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( 400 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 2 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            it('allows getting the % change of territory B with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.territories.B.visits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.territories.B.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).toBe( Infinity );
                expect( resultsAll[ 1 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            xit('allows getting the % change of each territory', function() {

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 1 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 2 ].percentageChange ).not.toBeDefined();
                expect( resultsAll[ 3 ].percentageChange ).not.toBeDefined();

                expect( resultsAll[ 0 ].value.territories.A.percentageChange ).toBe( 400 );
                expect( resultsAll[ 1 ].value.territories.A.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 2 ].value.territories.A.percentageChange ).toBe( 0 );
                expect( resultsAll[ 3 ].value.territories.A.percentageChange ).toBe( -100 );

                expect( resultsAll[ 0 ].value.territories.B.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 1 ].value.territories.B.percentageChange ).toBe( 0 );
                expect( resultsAll[ 2 ].value.territories.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].value.territories.B.percentageChange ).toBe( -100 );

            });

            xit('allows getting the % change of each place and territory and total', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.totalVisits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( 200 );
                expect( resultsAll[ 2 ].percentageChange ).toBeCloseTo( 13.33 );
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );

                expect( resultsAll[ 0 ].value.places.A.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.places.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].value.places.A.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].value.places.A.percentageChange ).toBeCloseTo( -41.18 );

                expect( resultsAll[ 0 ].value.places.B.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.places.B.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 2 ].value.places.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].value.places.B.percentageChange ).toBe( 0 );

                expect( resultsAll[ 0 ].value.territories.A.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.territories.A.percentageChange ).toBe( 650 );
                expect( resultsAll[ 2 ].value.territories.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].value.territories.A.percentageChange ).toBe( Infinity );

                expect( resultsAll[ 0 ].value.territories.B.percentageChange ).toBe( 0 );
                expect( resultsAll[ 1 ].value.territories.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].value.territories.B.percentageChange ).toBe( Infinity );
                expect( resultsAll[ 3 ].value.territories.B.percentageChange ).toBe( -100 );

            });

        });

    });


});