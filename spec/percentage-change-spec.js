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

        var myAccessor, origAccessor, percentageChangeFakeGroup;

        beforeEach(function() {

            myAccessor = jasmine.createSpy( 'myAccessor' );
            percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

        });

        it('_defaultKeyAccessor() returns default key accessor', function() {

            expect( percentageChangeFakeGroup._defaultKeyAccessor() ).toEqual( jasmine.any( Function ) );

        });

        describe('keyAccessor()', function() {

            it('returns current keyAccessor', function() {

                expect( percentageChangeFakeGroup.keyAccessor() ).toEqual( jasmine.any( Function ) );

            });

            it('allows configuring keyAccessor', function() {

                origAccessor = percentageChangeFakeGroup.keyAccessor();

                percentageChangeFakeGroup.keyAccessor( myAccessor );

                expect( percentageChangeFakeGroup.keyAccessor() ).toBe(myAccessor);
                expect( percentageChangeFakeGroup.keyAccessor() ).not.toBe(origAccessor);

            });

            it('is used by all()', function() {

                origAccessor = percentageChangeFakeGroup.keyAccessor();

                percentageChangeFakeGroup.keyAccessor( myAccessor );

                expect( myAccessor ).not.toHaveBeenCalled();

                percentageChangeFakeGroup.all();

                expect( myAccessor ).toHaveBeenCalled();

            });

            it('is used by top()', function() {

                origAccessor = percentageChangeFakeGroup.keyAccessor();

                percentageChangeFakeGroup.keyAccessor( myAccessor );

                expect( myAccessor ).not.toHaveBeenCalled();

                percentageChangeFakeGroup.top( Infinity );

                expect( myAccessor ).toHaveBeenCalled();

            });

        });

    });

    describe('value accessors', function() {

        var myAccessor, origAccessor, percentageChangeFakeGroup;

        beforeEach(function() {

            myAccessor = jasmine.createSpy( 'myAccessor' );
            percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

        });

        it('_defaultValueAccessor() returns default value accessor', function() {

            expect( percentageChangeFakeGroup._defaultValueAccessor() ).toEqual( jasmine.any( Function ) );

        });

        describe('valueAccessor()', function() {

            it('returns current valueAccessor', function() {

                expect( percentageChangeFakeGroup.valueAccessor() ).toEqual( jasmine.any( Function ) );

            });

            it('allows configuring valueAccessor', function() {

                origAccessor = percentageChangeFakeGroup.valueAccessor();

                percentageChangeFakeGroup.valueAccessor( myAccessor );

                expect( percentageChangeFakeGroup.valueAccessor() ).toBe(myAccessor);
                expect( percentageChangeFakeGroup.valueAccessor() ).not.toBe(origAccessor);

            });

            it('is used by all()', function() {

                origAccessor = percentageChangeFakeGroup.valueAccessor();

                percentageChangeFakeGroup.valueAccessor( myAccessor );

                expect( myAccessor ).not.toHaveBeenCalled();

                percentageChangeFakeGroup.all();

                expect( myAccessor ).toHaveBeenCalled();

            });

            it('is used by top()', function() {

                origAccessor = percentageChangeFakeGroup.valueAccessor();

                percentageChangeFakeGroup.valueAccessor( myAccessor );

                expect( myAccessor ).not.toHaveBeenCalled();

                percentageChangeFakeGroup.top( Infinity );

                expect( myAccessor ).toHaveBeenCalled();

            });

        });

    });

    describe('calculation accessors', function() {

        var myAccessor, origAccessor, percentageChangeFakeGroup;

        beforeEach(function() {

            myAccessor = jasmine.createSpy( 'myAccessor' );
            percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

        });

        it('returns current calculationAccessor', function() {

            expect( percentageChangeFakeGroup.calculationAccessor() ).toEqual( jasmine.any( Function ) );

        });

        it('allows configuring calculationAccessor', function() {

            origAccessor = percentageChangeFakeGroup.calculationAccessor();

            percentageChangeFakeGroup.calculationAccessor( myAccessor );

            expect( percentageChangeFakeGroup.calculationAccessor() ).toBe(myAccessor);
            expect( percentageChangeFakeGroup.calculationAccessor() ).not.toBe(origAccessor);

        });

        it('default and custom values are used by all()', function() {

            // Get default
            origAccessor = percentageChangeFakeGroup.calculationAccessor();

            // Spy on it
            var block = { origAccessor: origAccessor };
            var defaultAccessor = spyOn( block, 'origAccessor' );

            expect( defaultAccessor ).not.toHaveBeenCalled();
            expect( myAccessor ).not.toHaveBeenCalled();

            // Set spied default
            percentageChangeFakeGroup.calculationAccessor( defaultAccessor );

            percentageChangeFakeGroup.all();

            expect( defaultAccessor ).toHaveBeenCalled();
            expect( myAccessor ).not.toHaveBeenCalled();

            defaultAccessor.calls.reset();
            myAccessor.calls.reset();

            percentageChangeFakeGroup.calculationAccessor( myAccessor );

            percentageChangeFakeGroup.all();

            expect( defaultAccessor ).not.toHaveBeenCalled();
            expect( myAccessor ).toHaveBeenCalled();

        });

        it('default and custom values are used by top()', function() {

            // Get default
            origAccessor = percentageChangeFakeGroup.calculationAccessor();

            // Spy on it
            var block = { origAccessor: origAccessor };
            var defaultAccessor = spyOn( block, 'origAccessor' );

            expect( defaultAccessor ).not.toHaveBeenCalled();
            expect( myAccessor ).not.toHaveBeenCalled();

            // Set spied default
            percentageChangeFakeGroup.calculationAccessor( defaultAccessor );

            percentageChangeFakeGroup.top( Infinity );

            expect( defaultAccessor ).toHaveBeenCalled();
            expect( myAccessor ).not.toHaveBeenCalled();

            defaultAccessor.calls.reset();
            myAccessor.calls.reset();

            percentageChangeFakeGroup.calculationAccessor( myAccessor );

            percentageChangeFakeGroup.top( Infinity );

            expect( defaultAccessor ).not.toHaveBeenCalled();
            expect( myAccessor ).toHaveBeenCalled();

        });

        it('supports calculating values from keys on the value key', function() {

        });

    });

    describe('iteration accessors', function() {

        var myAccessor, origAccessor, percentageChangeFakeGroup;

        beforeEach(function() {

            myAccessor = jasmine.createSpy( 'myAccessor' );
            percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

        });

        it('returns current iterationAccessor', function() {

            expect( percentageChangeFakeGroup.iterationAccessor() ).toEqual( jasmine.any( String ) );

        });

        it('allows configuring iterationAccessor', function() {

            origAccessor = percentageChangeFakeGroup.iterationAccessor();

            percentageChangeFakeGroup.iterationAccessor( myAccessor );

            expect( percentageChangeFakeGroup.iterationAccessor() ).toBe(myAccessor);
            expect( percentageChangeFakeGroup.iterationAccessor() ).not.toBe(origAccessor);

        });

        it('is used by all()', function() {

        });

        it('is used by top()', function() {

        });

        it('support fanning out many calculations on values from a specific key on the value key', function() {

        });

    });


    describe('orderByPercentageChange', function() {

        var percentageChangeGroupVisitsByPlaceAndTerritoryByDate;

        beforeEach(function() {
            mockCustomKeyValueData();
            percentageChangeGroupVisitsByPlaceAndTerritoryByDate = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByPlaceAndTerritoryByDate );
            percentageChangeGroupVisitsByPlaceAndTerritoryByDate._debug(true);

        });

        afterEach(function() {
            percentageChangeGroupVisitsByPlaceAndTerritoryByDate = null;
        });

        it('allows retrieving the current configuration', function() {

            var state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).toBe( false );

        });


        it('is off by default', function() {

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
            var state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).toBe( false );

        });

        it('can be turned on', function() {

            var state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).not.toBe( true );

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(1);

            state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).toBe( 1 );

        });


        it('can be turned off by passing 0 or false', function() {

            var state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).not.toBe( 1 );
            expect( state ).not.toBe( -1 );

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(1);
            state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();

            expect( state ).toBe( 1 );

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(0);
            state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();

            expect( state ).not.toBe( 1 );
            expect( state ).not.toBe( -1 );
            expect( state ).toBe( false );

        });

        it('allows sorting ascending by passing 1 using valueAccessor', function() {

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(1);

            groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.A.visits; } );

            var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

            //expect( resultsAll[ 0 ].key ).toBe( "2012-01-13" );
            //expect( resultsAll[ 1 ].key ).toBe( "2012-01-11" );
            expect( resultsAll[ 3 ].key ).toBe( "2012-01-15" );
            expect( resultsAll[ 2 ].key ).toBe( "2012-01-12" );

            //expect( resultsAll[ 0 ].value ).toBe( 17 );
            //expect( resultsAll[ 1 ].value ).toBe( 3 );
            expect( resultsAll[ 3 ].value ).toBe( 10 );
            expect( resultsAll[ 2 ].value ).toBe( 0 );

            expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );
            expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );

        });

        xit('allows sorting ascending by passing 1 using calculationAccessor and iterationAccessor', function() {

            //percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor( function(d) { return d.visits; } );
            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor( 'places' );

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(1);

            groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.A.visits; } );

            var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

            //expect( resultsAll[ 1 ].key ).toBe( "2012-01-13" );
            //expect( resultsAll[ 3 ].key ).toBe( "2012-01-11" );
            //expect( resultsAll[ 2 ].key ).toBe( "2012-01-15" );
            //expect( resultsAll[ 0 ].key ).toBe( "2012-01-12" );

            expect( resultsAll[ 1 ].value ).toBe( undefined );
            expect( resultsAll[ 3 ].value ).toBe( undefined );
            expect( resultsAll[ 2 ].value ).toBe( undefined );
            expect( resultsAll[ 0 ].value ).toBe( undefined );

            expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 0 ].percentageChange ).toBeNaN();

            //expect( resultsAll[ 1 ].places[ 0 ].key ).toBe( 'A' );
            expect( resultsAll[ 1 ].places[ 0 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 1 ].places[ 0 ].value ).toBe( 17 );
            //expect( resultsAll[ 1 ].places[ 2 ].key ).toBe( 'B' );
            expect( resultsAll[ 1 ].places[ 2 ].percentageChange ).toBeCloseTo( -41.1765 );
            //expect( resultsAll[ 1 ].places[ 2 ].value ).toBe( 0 );
            //expect( resultsAll[ 1 ].places[ 1 ].key ).toBe( 'C' );
            expect( resultsAll[ 1 ].places[ 1 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 1 ].places[ 1 ].value ).toBe( 0 );

            //expect( resultsAll[ 3 ].places[ 0 ].key ).toBe( 'A' );
            expect( resultsAll[ 3 ].places[ 0 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 3 ].places[ 0 ].value ).toBe( 3 );
            //expect( resultsAll[ 3 ].places[ 1 ].key ).toBe( 'B' );
            expect( resultsAll[ 3 ].places[ 1 ].percentageChange ).toBe( -100 );
            //expect( resultsAll[ 3 ].places[ 1 ].value ).toBe( 0 );
            //expect( resultsAll[ 3 ].places[ 2 ].key ).toBe( 'C' );
            expect( resultsAll[ 3 ].places[ 2 ].percentageChange ).toBe( -100 );
            //expect( resultsAll[ 3 ].places[ 2 ].value ).toBe( 3 );

            //expect( resultsAll[ 2 ].places[ 2 ].key ).toBe( 'A' );
            expect( resultsAll[ 2 ].places[ 2 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 2 ].places[ 2 ].value ).toBe( 10 );
            //expect( resultsAll[ 2 ].places[ 0 ].key ).toBe( 'B' );
            expect( resultsAll[ 2 ].places[ 0 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 2 ].places[ 0 ].value ).toBe( 0 );
            //expect( resultsAll[ 2 ].places[ 1 ].key ).toBe( 'C' );
            expect( resultsAll[ 2 ].places[ 1 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 2 ].places[ 1 ].value ).toBe( 0 );

            //expect( resultsAll[ 0 ].places[ 1 ].key ).toBe( 'A' );
            expect( resultsAll[ 0 ].places[ 1 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 0 ].places[ 1 ].value ).toBe( 0 );
            //expect( resultsAll[ 0 ].places[ 0 ].key ).toBe( 'B' );
            expect( resultsAll[ 0 ].places[ 0 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 0 ].places[ 0 ].value ).toBe( 15 );
            //expect( resultsAll[ 0 ].places[ 2 ].key ).toBe( 'C' );
            expect( resultsAll[ 0 ].places[ 2 ].percentageChange ).toBeCloseTo( -100 );
            //expect( resultsAll[ 0 ].places[ 2 ].value ).toBe( 0 );

        });

        it('allows sorting descending by passing -1 using valueAccessor', function() {

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(-1);

            var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

            //expect( resultsAll[ 3 ].key ).toBe( "2012-01-13" );
            //expect( resultsAll[ 2 ].key ).toBe( "2012-01-11" );
            //expect( resultsAll[ 0 ].key ).toBe( "2012-01-15" );
            //expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );

            //expect( resultsAll[ 3 ].value ).toBe( 17 );
            //expect( resultsAll[ 2 ].value ).toBe( 3 );
            //expect( resultsAll[ 0 ].value ).toBe( 10 );
            //expect( resultsAll[ 1 ].value ).toBe( 0 );

            expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 0 ].percentageChange ).toBeCloseTo( -41.176 );
            expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );


        });

        xit('allows sorting descending by passing -1 using calculationAccessor and iterationAccessor', function() {

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor( function(d) { return d.visits; } );
            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor( 'places' );
            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(-1);

            var state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).toBe( -1 );

            var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

            //expect( resultsAll[ 2 ].key ).toBe( "2012-01-13" );
            //expect( resultsAll[ 0 ].key ).toBe( "2012-01-11" );
            //expect( resultsAll[ 1 ].key ).toBe( "2012-01-15" );
            //expect( resultsAll[ 3 ].key ).toBe( "2012-01-12" );

            expect( resultsAll[ 2 ].value ).toBe( undefined );
            expect( resultsAll[ 0 ].value ).toBe( undefined );
            expect( resultsAll[ 1 ].value ).toBe( undefined );
            expect( resultsAll[ 3 ].value ).toBe( undefined );

            expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
            expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

            //expect( resultsAll[ 2 ].places[ 2 ].key ).toBe( 'A' );
            expect( resultsAll[ 2 ].places[ 2 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 2 ].places[ 2 ].value ).toBe( 17 );
            //expect( resultsAll[ 2 ].places[ 0 ].key ).toBe( 'B' );
            expect( resultsAll[ 2 ].places[ 0 ].percentageChange ).toBe( -100 );
            //expect( resultsAll[ 2 ].places[ 0 ].value ).toBe( 0 );
            //expect( resultsAll[ 2 ].places[ 1 ].key ).toBe( 'C' );
            expect( resultsAll[ 2 ].places[ 1 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 2 ].places[ 1 ].value ).toBe( 0 );

            //expect( resultsAll[ 0 ].places[ 2 ].key ).toBe( 'A' );
            expect( resultsAll[ 0 ].places[ 2 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 0 ].places[ 2 ].value ).toBe( 3 );
            //expect( resultsAll[ 0 ].places[ 1 ].key ).toBe( 'B' );
            expect( resultsAll[ 0 ].places[ 1 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 0 ].places[ 1 ].value ).toBe( 0 );
            //expect( resultsAll[ 0 ].places[ 0 ].key ).toBe( 'C' );
            expect( resultsAll[ 0 ].places[ 0 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 0 ].places[ 0 ].value ).toBe( 3 );

            //expect( resultsAll[ 1 ].places[ 0 ].key ).toBe( 'A' );
            expect( resultsAll[ 1 ].places[ 0 ].percentageChange ).toBeCloseTo( -41.1765 );
            //expect( resultsAll[ 1 ].places[ 0 ].value ).toBe( 10 );
            //expect( resultsAll[ 1 ].places[ 2 ].key ).toBe( 'B' );
            expect( resultsAll[ 1 ].places[ 2 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 1 ].places[ 2 ].value ).toBe( 0 );
            //expect( resultsAll[ 1 ].places[ 1 ].key ).toBe( 'C' );
            expect( resultsAll[ 1 ].places[ 1 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 1 ].places[ 1 ].value ).toBe( 0 );

            //expect( resultsAll[ 3 ].places[ 0 ].key ).toBe( 'A' );
            expect( resultsAll[ 3 ].places[ 0 ].percentageChange ).toBeCloseTo( -100 );
            //expect( resultsAll[ 3 ].places[ 0 ].value ).toBe( 0 );
            //expect( resultsAll[ 3 ].places[ 2 ].key ).toBe( 'B' );
            expect( resultsAll[ 3 ].places[ 2 ].percentageChange ).toBeNaN();
            //expect( resultsAll[ 3 ].places[ 2 ].value ).toBe( 15 );
            //expect( resultsAll[ 3 ].places[ 1 ].key ).toBe( 'C' );
            expect( resultsAll[ 3 ].places[ 1 ].percentageChange ).toBeCloseTo( -100 );
            //expect( resultsAll[ 3 ].places[ 1 ].value ).toBe( 0 );

        });

        it('treats other values as false', function() {

            var state;

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(16);
            state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).toBe( false );

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(1);
            state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).toBe( 1 );

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(-123);
            state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).toBe( false );

            percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange(16);
            state = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange();
            expect( state ).toBe( false );

        });

    });


    describe('all()', function() {

        it('calculates percentage change for a set of numbers', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].percentageChange ).toBeNaN();
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
            expect( results[0].percentageChange ).toBeNaN();
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
            expect( results[0].percentageChange ).toBeNaN();
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


        it('supports ordering ascending by percentage change', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
            percentageChangeFakeGroup.orderByPercentageChange( 1 );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].percentageChange ).toBeNaN();
            expect( results[4].percentageChange ).toBe( 50 );
            expect( results[5].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[1].percentageChange ).toBe( -70 );
            expect( results[6].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBe( 20 );
            expect( results[2].percentageChange ).toBeCloseTo( -41.66666666666667 );

        });

        it('supports ordering descending by percentage change', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
            percentageChangeFakeGroup.orderByPercentageChange( -1 );

            var results = percentageChangeFakeGroup.all();

            expect( results[6].percentageChange ).toBeNaN();
            expect( results[2].percentageChange ).toBe( 50 );
            expect( results[0].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[5].percentageChange ).toBe( -70 );
            expect( results[1].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBe( 20 );
            expect( results[4].percentageChange ).toBeCloseTo( -41.66666666666667 );

        });

        it('supports filtering in crossfilter', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].percentageChange ).toBeNaN();
            expect( results[1].percentageChange ).toBeCloseTo( 50 );
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBeCloseTo( -70 );
            expect( results[4].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[5].percentageChange ).toBeCloseTo( 20 );
            expect( results[6].percentageChange ).toBeCloseTo( -41.66666666666667 );

            dimensionVisitsForFiltering.filterRange( [ 3,11 ] );

            var results = percentageChangeFakeGroup.all();

            expect( results[0].percentageChange ).toBeNaN();
            expect( results[1].percentageChange ).toBeNaN();
            expect( results[2].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[3].percentageChange ).toBeCloseTo( -70 );
            expect( results[4].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[5].percentageChange ).toBeCloseTo( -100 );
            expect( results[6].percentageChange ).toBeNaN();

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

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
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

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBe( 400 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

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

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
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

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBe( 150 );
                expect( resultsAll[ 2 ].percentageChange ).toBeCloseTo( 13.33 );
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );

            });

            it('allows getting the % change of Place A with a custom valueAccessor', function() {

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

                expect( resultsAll[ 0 ].value ).toBe( 3 );
                expect( resultsAll[ 1 ].value ).toBe( 0 );
                expect( resultsAll[ 2 ].value ).toBe( 17 );
                expect( resultsAll[ 3 ].value ).toBe( 10 );

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );

            });

            it('allows getting the % change of Place B with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.B.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 0 ]._debug.prevDayKey ).toBe( "None" );
                expect( resultsAll[ 0 ]._debug.thisDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 1 ]._debug.prevDayKey ).toBe( "2012-01-11" );
                expect( resultsAll[ 1 ]._debug.thisDayKey ).toBe( "2012-01-12" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-15" );

                expect( resultsAll[ 0 ].value ).toBe( 0 );
                expect( resultsAll[ 1 ].value ).toBe( 15 );
                expect( resultsAll[ 2 ].value ).toBe( 0 );
                expect( resultsAll[ 3 ].value ).toBe( 0 );

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

            });

            it('allows getting the % change of each place with a custom iterationAccessor and calculationAccessor', function() {

                //percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('places');
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor( function(d) { return d.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                //expect( resultsAll[ 0 ].key ).toBe( '2012-01-11' );
                //expect( resultsAll[ 1 ].key ).toBe( '2012-01-12' );
                //expect( resultsAll[ 2 ].key ).toBe( '2012-01-13' );
                //expect( resultsAll[ 3 ].key ).toBe( '2012-01-15' );

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

                expect( resultsAll[ 0 ].places.A.percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].places.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].places.A.percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].places.A.percentageChange ).toBeCloseTo( -41.18 );

                expect( resultsAll[ 0 ].places.B.percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].places.B.percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].places.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].places.B.percentageChange ).toBeNaN();

            });

            xit('allows getting the % change of each place sorted ascending with a custom iterationAccessor and calculationAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('places');
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor( function(d) { return d.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange( 1 );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

                //expect( resultsAll[ 0 ].places[0].key ).toBe( "A" );
                expect( resultsAll[ 0 ].places[0].percentageChange ).toBeNaN();
                //expect( resultsAll[ 0 ].places[1].key ).toBe( "B" );
                expect( resultsAll[ 0 ].places[1].percentageChange ).toBeNaN();
                //expect( resultsAll[ 0 ].places[2].key ).toBe( "C" );
                expect( resultsAll[ 0 ].places[2].percentageChange ).toBeNaN();

                //expect( resultsAll[ 1 ].places[0].key ).toBe( "B" );
                expect( resultsAll[ 1 ].places[0].percentageChange ).toBeNaN();
                //expect( resultsAll[ 1 ].places[1].key ).toBe( "A" );
                expect( resultsAll[ 1 ].places[1].percentageChange ).toBe( -100 );
                //expect( resultsAll[ 1 ].places[2].key ).toBe( "C" );
                expect( resultsAll[ 1 ].places[2].percentageChange ).toBe( -100 );

                //expect( resultsAll[ 2 ].places[0].key ).toBe( "A" );
                expect( resultsAll[ 2 ].places[0].percentageChange ).toBeNaN();
                //expect( resultsAll[ 2 ].places[1].key ).toBe( "C" );
                expect( resultsAll[ 2 ].places[1].percentageChange ).toBeNaN();
                //expect( resultsAll[ 2 ].places[2].key ).toBe( "B" );
                expect( resultsAll[ 2 ].places[2].percentageChange ).toBe( -100 );

                //expect( resultsAll[ 3 ].places[0].key ).toBe( "B" );
                expect( resultsAll[ 3 ].places[0].percentageChange ).toBeNaN();
                //expect( resultsAll[ 3 ].places[1].key ).toBe( "C" );
                expect( resultsAll[ 3 ].places[1].percentageChange ).toBeNaN();
                //expect( resultsAll[ 3 ].places[2].key ).toBe( "A" );
                expect( resultsAll[ 3 ].places[2].percentageChange ).toBeCloseTo( -41.18 );

            });

            xit('allows getting the % change of each place sorted descending with a custom iterationAccessor and calculationAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('places');
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor( function(d) { return d.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange( -1 );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

                //expect( resultsAll[ 0 ].places[0].key ).toBe( "A" );
                expect( resultsAll[ 0 ].places[0].percentageChange ).toBeCloseTo( -41.18 );
                //expect( resultsAll[ 0 ].places[2].key ).toBe( "B" );
                expect( resultsAll[ 0 ].places[2].percentageChange ).toBeNaN();
                //expect( resultsAll[ 0 ].places[1].key ).toBe( "C" );
                expect( resultsAll[ 0 ].places[1].percentageChange ).toBeNaN();

                //expect( resultsAll[ 1 ].places[0].key ).toBe( "B" );
                expect( resultsAll[ 1 ].places[0].percentageChange ).toBe( -100 );
                //expect( resultsAll[ 1 ].places[2].key ).toBe( "A" );
                expect( resultsAll[ 1 ].places[2].percentageChange ).toBeNaN();
                //expect( resultsAll[ 1 ].places[1].key ).toBe( "C" );
                expect( resultsAll[ 1 ].places[1].percentageChange ).toBeNaN();

                //expect( resultsAll[ 2 ].places[0].key ).toBe( "A" );
                expect( resultsAll[ 2 ].places[0].percentageChange ).toBe( -100 );
                //expect( resultsAll[ 2 ].places[1].key ).toBe( "C" );
                expect( resultsAll[ 2 ].places[1].percentageChange ).toBe( -100 );
                //expect( resultsAll[ 2 ].places[2].key ).toBe( "B" );
                expect( resultsAll[ 2 ].places[2].percentageChange ).toBeNaN();

                //expect( resultsAll[ 3 ].places[1].key ).toBe( "B" );
                expect( resultsAll[ 3 ].places[1].percentageChange ).toBeNaN();
                //expect( resultsAll[ 3 ].places[0].key ).toBe( "C" );
                expect( resultsAll[ 3 ].places[0].percentageChange ).toBeNaN();
                //expect( resultsAll[ 3 ].places[2].key ).toBe( "A" );
                expect( resultsAll[ 3 ].places[2].percentageChange ).toBeNaN();

            });

            it('allows getting the % change of territory A with a custom valueAccessor', function() {

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

                expect( resultsAll[ 0 ].value ).toBe( 3 );
                expect( resultsAll[ 1 ].value ).toBe( 15 );
                expect( resultsAll[ 2 ].value ).toBe( 0 );
                expect( resultsAll[ 3 ].value ).toBe( 10 );

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBe( 400 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

            });

            it('allows getting the % change of territory B with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.territories.B.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            it('allows getting the % change of each territory with a custom iterationAccessor and calculationAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor(function(d) { return d.visits; });
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('territories');

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

                expect( resultsAll[ 0 ].territories.A.percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].territories.A.percentageChange ).toBe( 400 );
                expect( resultsAll[ 2 ].territories.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].territories.A.percentageChange ).toBeNaN();

                expect( resultsAll[ 0 ].territories.B.percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].territories.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].territories.B.percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].territories.B.percentageChange ).toBe( -100 );

            });

            xit('allows getting the % change of each place and territory and total with a custom calculationAccessor, iterationAccessor, and custom iterationValueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor(function(d) { return d.visits; });
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('territories');
                //percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationValueAccessor( function(d) { return d.value.visits; } );
                //percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.totalVisits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBe( 150 );
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

            it('allows getting the % change of Place A with a custom valueAccessor ordered ascending by % change', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange( 1 );

                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                //expect( resultsAll[ 1 ].key ).toBe( "2012-01-13" );
                //expect( resultsAll[ 0 ].key ).toBe( "2012-01-11" );
                //expect( resultsAll[ 3 ].key ).toBe( "2012-01-15" );
                //expect( resultsAll[ 2 ].key ).toBe( "2012-01-12" );

                //expect( resultsAll[ 1 ].value ).toBe( 17 );
                //expect( resultsAll[ 0 ].value ).toBe( 3 );
                //expect( resultsAll[ 3 ].value ).toBe( 10 );
                //expect( resultsAll[ 2 ].value ).toBe( 0 );

                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );

            });

            it('allows getting the % change of Place A with a custom valueAccessor ordered descending by % change', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange( -1 );

                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.all();

                //expect( resultsAll[ 2 ].key ).toBe( "2012-01-13" );
                //expect( resultsAll[ 3 ].key ).toBe( "2012-01-11" );
                //expect( resultsAll[ 0 ].key ).toBe( "2012-01-15" );
                //expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );

                //expect( resultsAll[ 2 ].value ).toBe( 17 );
                //expect( resultsAll[ 3 ].value ).toBe( 3 );
                //expect( resultsAll[ 0 ].value ).toBe( 10 );
                //expect( resultsAll[ 1 ].value ).toBe( 0 );

                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );

            });

        });

    });



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
            expect( results[6].percentageChange ).toBeNaN();

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
            expect( results[3].percentageChange ).toBeNaN();

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



        it('supports ordering ascending by percentage change', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
            percentageChangeFakeGroup.orderByPercentageChange( 1 );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[3].percentageChange ).toBe( 20 );
            expect( results[5].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[6].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[2].percentageChange ).toBeCloseTo( -41.66666666666667 );
            expect( results[1].percentageChange ).toBeCloseTo( -70 );
            expect( results[4].percentageChange ).toBeCloseTo( 50 );
            expect( results[0].percentageChange ).toBeNaN();

        });


        it('supports ordering descending by percentage change', function() {

            var percentageChangeFakeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );
            percentageChangeFakeGroup.orderByPercentageChange( -1 );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[3].percentageChange ).toBe( 20 );
            expect( results[1].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[0].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[4].percentageChange ).toBeCloseTo( -41.66666666666667 );
            expect( results[5].percentageChange ).toBeCloseTo( -70 );
            expect( results[2].percentageChange ).toBeCloseTo( 50 );
            expect( results[6].percentageChange ).toBeNaN();

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
            expect( results[6].percentageChange ).toBeNaN();

            dimensionVisitsForFiltering.filterRange( [ 3,11 ] );

            var results = percentageChangeFakeGroup.top(Infinity);

            expect( results[0].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[1].percentageChange ).toBeCloseTo( 233.33333333333334 );
            expect( results[2].percentageChange ).toBeNaN();
            expect( results[3].percentageChange ).toBe( -70 );
            expect( results[4].percentageChange ).toBeNaN();
            expect( results[5].percentageChange ).toBe( -100 );
            expect( results[6].percentageChange ).toBeNaN();

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
            var mySpy = jasmine.createSpy( origKey ).and.callThrough();
            rollingAverageFakeGroup.valueAccessor( mySpy );

            rollingAverageFakeGroup.top( Infinity );

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

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
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
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
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
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).not.toBe( 41.18 );

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.totalVisits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.totalVisits; } );

                resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-15" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-11" );

                expect( resultsAll[ 0 ].value ).toBe( 17 );
                expect( resultsAll[ 1 ].value ).toBe( 15 );
                expect( resultsAll[ 2 ].value ).toBe( 10 );
                expect( resultsAll[ 3 ].value ).toBe( 6 );

                expect( resultsAll[ 0 ].percentageChange ).toBeCloseTo( 13.33 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( 150 );
                expect( resultsAll[ 2 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

            });

            it('allows getting the % change of Place A with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].key ).toBe( "2012-01-13" );
                expect( resultsAll[ 1 ].key ).toBe( "2012-01-15" );
                expect( resultsAll[ 2 ].key ).toBe( "2012-01-11" );
                expect( resultsAll[ 3 ].key ).toBe( "2012-01-12" );

                expect( resultsAll[ 0 ].value ).toBe( 17 );
                expect( resultsAll[ 1 ].value ).toBe( 10 );
                expect( resultsAll[ 2 ].value ).toBe( 3 );
                expect( resultsAll[ 3 ].value ).toBe( 0 );

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            it('allows getting the % change of Place B with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.B.visits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.B.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

            });

            it('allows getting the % change of each place with a custom iterationAccessor and calculationAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('places');
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor( function(d) { return d.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                //expect( resultsAll[ 1 ].key ).toBe( '2012-01-13' );
                //expect( resultsAll[ 2 ].key ).toBe( '2012-01-15' );
                //expect( resultsAll[ 3 ].key ).toBe( '2012-01-11' );
                //expect( resultsAll[ 0 ].key ).toBe( '2012-01-12' );

                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();

                expect( resultsAll[ 1 ].value ).not.toBeDefined();
                expect( resultsAll[ 2 ].value ).not.toBeDefined();
                expect( resultsAll[ 3 ].value ).not.toBeDefined();
                expect( resultsAll[ 0 ].value ).not.toBeDefined();

                expect( resultsAll[ 0 ]._debug.thisDayKey ).toBe( '2012-01-12' );
                expect( resultsAll[ 0 ]._debug.places.A.value ).toBe( 0 );
                expect( resultsAll[ 0 ]._debug.prevDayKey ).toBe( '2012-01-11' );
                expect( resultsAll[ 0 ]._debug.places.A.prevValue ).toBe( 3 );

                //expect( resultsAll[ 1 ].places.A.value ).toBe( 17 );
                //expect( resultsAll[ 2 ].places.A.value ).toBe( 10 );
                //expect( resultsAll[ 3 ].places.A.value ).toBe( 3 );
                //expect( resultsAll[ 0 ].places.A.value ).toBe( 0 );

                expect( resultsAll[ 1 ].places.A.percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].places.A.percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 3 ].places.A.percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].places.A.percentageChange ).toBe( -100 );

                expect( resultsAll[ 1 ].places.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].places.B.percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].places.B.percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].places.B.percentageChange ).toBeNaN();

            });

            xit('allows getting the % change of each place sorted ascending with a custom iterationAccessor and calculationAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('places');
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor( function(d) { return d.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange( 1 );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                //expect( resultsAll[ 1 ].key ).toBe( '2012-01-13' );
                //expect( resultsAll[ 2 ].key ).toBe( '2012-01-15' );
                //expect( resultsAll[ 3 ].key ).toBe( '2012-01-11' );
                //expect( resultsAll[ 0 ].key ).toBe( '2012-01-12' );

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

                expect( resultsAll[ 0 ].value ).not.toBeDefined();
                expect( resultsAll[ 1 ].value ).not.toBeDefined();
                expect( resultsAll[ 2 ].value ).not.toBeDefined();
                expect( resultsAll[ 3 ].value ).not.toBeDefined();

                //expect( resultsAll[ 0 ].places[ 1 ].key ).toBe( "A" );
                expect( resultsAll[ 0 ].places[ 1 ].percentageChange ).toBe( -100 );
                //expect( resultsAll[ 0 ].places[ 1 ].value ).toBe( 0 );
                //expect( resultsAll[ 0 ].places[ 1 ]._debug.value ).toBe( 0 );
                //expect( resultsAll[ 0 ].places[ 1 ]._debug.prevValue ).toBe( 3 );
                //expect( resultsAll[ 1 ].places[ 0 ].key ).toBe( "A" );
                expect( resultsAll[ 1 ].places[ 0 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 2 ].places[ 2 ].key ).toBe( "A" );
                expect( resultsAll[ 2 ].places[ 2 ].percentageChange ).toBeCloseTo( -41.18 );
                //expect( resultsAll[ 3 ].places[ 0 ].key ).toBe( "A" );
                expect( resultsAll[ 3 ].places[ 0 ].percentageChange ).toBeNaN();

                //expect( resultsAll[ 0 ].places[ 0 ].key ).toBe( "B" );
                expect( resultsAll[ 0 ].places[ 0 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 1 ].places[ 2 ].key ).toBe( "B" );
                expect( resultsAll[ 1 ].places[ 2 ].percentageChange ).toBe( -100 );
                //expect( resultsAll[ 2 ].places[ 0 ].key ).toBe( "B" );
                expect( resultsAll[ 2 ].places[ 0 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 3 ].places[ 1 ].key ).toBe( "B" );
                expect( resultsAll[ 3 ].places[ 1 ].percentageChange ).toBeNaN();

            });

            xit('allows getting the % change of each place sorted descending with a custom iterationAccessor and calculationAccessor', function() {

                //percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.totalVisits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('places');
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor( function(d) { return d.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange( -1 );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();

                expect( resultsAll[ 0 ].value ).not.toBeDefined();
                expect( resultsAll[ 1 ].value ).not.toBeDefined();
                expect( resultsAll[ 2 ].value ).not.toBeDefined();
                expect( resultsAll[ 3 ].value ).not.toBeDefined();

                //expect( resultsAll[ 0 ].places[ 2 ].key ).toBe( "A" );
                expect( resultsAll[ 0 ].places[ 2 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 0 ].places[ 2 ].value ).toBe( 3 );
                //expect( resultsAll[ 1 ].places[ 0 ].key ).toBe( "A" );
                expect( resultsAll[ 1 ].places[ 0 ].percentageChange ).toBeCloseTo( -41.18 );
                //expect( resultsAll[ 2 ].places[ 2 ].key ).toBe( "A" );
                expect( resultsAll[ 2 ].places[ 2 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 3 ].places[ 0 ].key ).toBe( "A" );
                expect( resultsAll[ 3 ].places[ 0 ].percentageChange ).toBe( -100 );

                //expect( resultsAll[ 0 ].places[ 1 ].key ).toBe( "B" );
                expect( resultsAll[ 0 ].places[ 1 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 1 ].places[ 2 ].key ).toBe( "B" );
                expect( resultsAll[ 1 ].places[ 2 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 2 ].places[ 0 ].key ).toBe( "B" );
                expect( resultsAll[ 2 ].places[ 0 ].percentageChange ).toBe( -100 );
                //expect( resultsAll[ 3 ].places[ 2 ].key ).toBe( "B" );
                expect( resultsAll[ 3 ].places[ 2 ].percentageChange ).toBeNaN();

                //expect( resultsAll[ 0 ].places[ 0 ].key ).toBe( "C" );
                expect( resultsAll[ 0 ].places[ 0 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 1 ].places[ 1 ].key ).toBe( "C" );
                expect( resultsAll[ 1 ].places[ 1 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 2 ].places[ 1 ].key ).toBe( "C" );
                expect( resultsAll[ 2 ].places[ 1 ].percentageChange ).toBeNaN();
                //expect( resultsAll[ 3 ].places[ 1 ].key ).toBe( "C" );
                expect( resultsAll[ 3 ].places[ 1 ].percentageChange ).toBe( -100 );



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

                expect( resultsAll[ 0 ].value ).toBe( 15 );
                expect( resultsAll[ 1 ].value ).toBe( 10 );
                expect( resultsAll[ 2 ].value ).toBe( 3 );
                expect( resultsAll[ 3 ].value ).toBe( 0 );

                expect( resultsAll[ 0 ].percentageChange ).toBe( 400 );
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            it('allows getting the % change of territory B with a custom valueAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.territories.B.visits; } );
                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.territories.B.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );
                expect( resultsAll[ 3 ].percentageChange ).toBe( -100 );

            });

            it('allows getting the % change of each territory with a custom iterationAccessor and calculationAccessor', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.calculationAccessor(function(d) { return d.visits; });
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.iterationAccessor('territories');

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                expect( resultsAll[ 3 ].key ).toBe( '2012-01-11' );
                expect( resultsAll[ 0 ].key ).toBe( '2012-01-12' );
                expect( resultsAll[ 1 ].key ).toBe( '2012-01-13' );
                expect( resultsAll[ 2 ].key ).toBe( '2012-01-15' );

                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();

                expect( resultsAll[ 3 ].territories.A.percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].territories.A.percentageChange ).toBe( 400 );
                expect( resultsAll[ 1 ].territories.A.percentageChange ).toBe( -100 );
                expect( resultsAll[ 2 ].territories.A.percentageChange ).toBeNaN();

                expect( resultsAll[ 3 ].territories.B.percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].territories.B.percentageChange ).toBe( -100 );
                expect( resultsAll[ 1 ].territories.B.percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].territories.B.percentageChange ).toBe( -100 );

            });

            xit('allows getting the % change of each place and territory and total with a custom calculationAccessor, iterationAccessor, and custom iterationValueAccessor', function() {

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

            it('allows getting the % change of Place A with a custom valueAccessor ordered ascending by % change', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange( 1 );

                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                //expect( resultsAll[ 0 ].key ).toBe( "2012-01-13" );
                //expect( resultsAll[ 1 ].key ).toBe( "2012-01-11" );
                //expect( resultsAll[ 3 ].key ).toBe( "2012-01-15" );
                //expect( resultsAll[ 2 ].key ).toBe( "2012-01-12" );

                //expect( resultsAll[ 0 ].value ).toBe( 17 );
                //expect( resultsAll[ 1 ].value ).toBe( 3 );
                //expect( resultsAll[ 3 ].value ).toBe( 10 );
                //expect( resultsAll[ 2 ].value ).toBe( 0 );

                expect( resultsAll[ 0 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 3 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 2 ].percentageChange ).toBe( -100 );

            });

            it('allows getting the % change of Place A with a custom valueAccessor ordered descending by % change', function() {

                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.valueAccessor( function(d) { return d.value.places.A.visits; } );
                percentageChangeGroupVisitsByPlaceAndTerritoryByDate.orderByPercentageChange( -1 );

                groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.places.A.visits; } );

                var resultsAll = percentageChangeGroupVisitsByPlaceAndTerritoryByDate.top(Infinity);

                //expect( resultsAll[ 3 ].key ).toBe( "2012-01-13" );
                //expect( resultsAll[ 2 ].key ).toBe( "2012-01-11" );
                //expect( resultsAll[ 0 ].key ).toBe( "2012-01-15" );
                //expect( resultsAll[ 1 ].key ).toBe( "2012-01-12" );

                //expect( resultsAll[ 3 ].value ).toBe( 17 );
                //expect( resultsAll[ 2 ].value ).toBe( 3 );
                //expect( resultsAll[ 0 ].value ).toBe( 10 );
                //expect( resultsAll[ 1 ].value ).toBe( 0 );

                expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
                expect( resultsAll[ 0 ].percentageChange ).toBeCloseTo( -41.18 );
                expect( resultsAll[ 1 ].percentageChange ).toBe( -100 );

            });

        });

        describe('new needed features', function() {

            var dummyData,
                cx,
                dimensionPerson,
                dimensionP,
                dimensionPPerson,
                groupCommendationsOnP,
                groupCommendationsOnPerson,
                groupCommendationsOnPPerson,
                knownPersons,
                risingStars,
                ma,
                groupProbablyIt;


            beforeEach(function() {

                dummyData = [
                    { p: '01', person: 'Julie', commendations: 31 },
                    { p: '01', person: 'Adam', commendations: 26 },
                    { p: '01', person: 'Sauron', commendations: 29 },
                    { p: '02', person: 'Julie', commendations: 41 },
                    { p: '02', person: 'Adam', commendations: 32 },
                    { p: '02', person: 'Sauron', commendations: 51 },
                    { p: '03', person: 'Julie', commendations: 16 },
                    { p: '03', person: 'Adam', commendations: 37 },
                    { p: '03', person: 'Sauron', commendations: 48 }
                ];

                cx = crossfilter( dummyData );
                dimensionP = cx.dimension( function ( d ) { return d.p; } );
                dimensionPPerson = cx.dimension( function ( d ) { return d.p + '-' + d.person; } );
                dimensionPerson = cx.dimension( function ( d ) { return d.person; } );

                groupCommendationsOnP = dimensionP.group().reduceSum( function ( d ) { return d.commendations; } );
                groupCommendationsOnPPerson = dimensionPPerson.group().reduceSum( function ( d ) { return d.commendations; } );
                groupCommendationsOnPerson = dimensionPerson.group().reduceSum( function ( d ) { return d.commendations; } );

                knownPersons = dimensionPerson.group().all().map( function ( d ) { return d.key; } );

                groupProbablyIt = dimensionP.group().reduce(
                    function ( p, v ) {

                        p.commendations += v.commendations;

                        if ( p.persons[ v.person ] ) {
                            p.persons[ v.person ].commendations += v.commendations;
                        } else {
                            p.persons[ v.person ] = {
                                commendations: v.commendations
                            };
                        }

                        return p;
                    },
                    function ( p, v ) {

                        p.commendations -= v.commendations;

                        if ( p.persons[ v.person ] ) {
                            p.persons[ v.person ].commendations -= v.commendations;
                        } else {
                            delete p.persons[ v.person ];
                        }

                        return p;
                    },
                    function ( p, v ) {
                        var obj = {};

                        obj.commendations = 0;
                        obj.persons = {};

                        // Make sure each place is represented, with at least 0
                        var t = knownPersons.length,
                            i = -1;
                        while ( ++i < t ) {
                            obj.persons[ knownPersons[ i ] ] = {
                                commendations: 0
                            };
                        }

                        return obj;
                    }
                ).order(
                    function ( p ) {
                        return p.p;
                    }
                );

                ma = crossfilterMa.accumulateGroupForPercentageChange( groupProbablyIt, true );

                ma.calculationAccessor( function(d) { return d.commendations; });
                ma.iterationAccessor('persons');
            });

            it('supports easily finding a `rising star`', function() {

                risingStars = ma.top( Infinity );

                expect( risingStars[0].key ).toBe( '03' );
                expect( risingStars[0].value ).toBe( 101 );
                expect( risingStars[0].percentageChange ).toBeCloseTo( -18.54838 );
                expect( risingStars[0].persons[ 'Sauron' ].key ).toBe( 'Sauron' );
                expect( risingStars[0].persons[ 'Sauron' ].percentageChange ).toBeCloseTo( -5.88235294117647 );
                expect( risingStars[0].persons[ 'Julie' ].key ).toBe( 'Julie' );
                expect( risingStars[0].persons[ 'Julie' ].percentageChange ).toBeCloseTo( -60.97560975609756 );
                expect( risingStars[0].persons[ 'Adam' ].key ).toBe( 'Adam' );
                expect( risingStars[0].persons[ 'Adam' ].percentageChange ).toBeCloseTo( 15.625 );

                expect( risingStars[1].key ).toBe( '01' );
                expect( risingStars[1].value ).toBe( 86 );
                expect( risingStars[1].percentageChange ).toBeNaN();
                expect( risingStars[1].persons[ 'Sauron' ].key ).toBe( 'Sauron' );
                expect( risingStars[1].persons[ 'Sauron' ].percentageChange ).toBeNaN();
                expect( risingStars[1].persons[ 'Julie' ].key ).toBe( 'Julie' );
                expect( risingStars[1].persons[ 'Julie' ].percentageChange ).toBeNaN();
                expect( risingStars[1].persons[ 'Adam' ].key ).toBe( 'Adam' );
                expect( risingStars[1].persons[ 'Adam' ].percentageChange ).toBeNaN();

                expect( risingStars[2].key ).toBe( '02' );
                expect( risingStars[2].value ).toBe( 124 );
                expect( risingStars[2].percentageChange ).toBeCloseTo( 44.18604651162791 );
                expect( risingStars[2].persons[ 'Sauron' ].key ).toBe( 'Sauron' );
                expect( risingStars[2].persons[ 'Sauron' ].percentageChange ).toBeCloseTo( 75.86 );
                expect( risingStars[2].persons[ 'Julie' ].key ).toBe( 'Julie' );
                expect( risingStars[2].persons[ 'Julie' ].percentageChange ).toBeCloseTo( 32.2580645161 );
                expect( risingStars[2].persons[ 'Adam' ].key ).toBe( 'Adam' );
                expect( risingStars[2].persons[ 'Adam' ].percentageChange ).toBeCloseTo( 23.07692307692 );


                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].key).toBe( 'Sauron' );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].value).toBe( 48 );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].prevKey).toBe( 'Sauron' );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].prevValue).toBe( 51 );


                expect( risingStars[ 1 ]._debug.persons[ 'Sauron' ].key).toBe( 'Sauron' );
                expect( risingStars[ 1 ]._debug.persons[ 'Sauron' ].value).toBe( 29 );
                expect( risingStars[ 1 ]._debug.persons[ 'Sauron' ].prevKey).toBe( 'None' );
                expect( risingStars[ 1 ]._debug.persons[ 'Sauron' ].prevValue).toBe( 'None' );

            });

            it('supports sorting the iterationAccessor keys ascending', function() {

                ma.orderByPercentageChange( 1 );

                risingStars = ma.top( Infinity );

                expect( risingStars[1].key ).toBe( '03' );
                expect( risingStars[1].value ).toBe( 101 );
                expect( risingStars[1].percentageChange ).toBeCloseTo( -18.54838 );
                expect( risingStars[1].persons[ 1 ].key ).toBe( 'Sauron' );
                expect( risingStars[1].persons[ 1 ].percentageChange ).toBeCloseTo( -5.88235294117647 );
                expect( risingStars[1].persons[ 0 ].key ).toBe( 'Julie' );
                expect( risingStars[1].persons[ 0 ].percentageChange ).toBeCloseTo( -60.97560975609756 );
                expect( risingStars[1].persons[ 2 ].key ).toBe( 'Adam' );
                expect( risingStars[1].persons[ 2 ].percentageChange ).toBeCloseTo( 15.625 );

                expect( risingStars[0].key ).toBe( '01' );
                expect( risingStars[0].value ).toBe( 86 );
                expect( risingStars[0].percentageChange ).toBeNaN();
                //expect( risingStars[0].persons[ 2 ].key ).toBe( 'Sauron' );
                expect( risingStars[0].persons[ 2 ].percentageChange ).toBeNaN();
                expect( risingStars[0].persons[ 1 ].key ).toBe( 'Julie' );
                expect( risingStars[0].persons[ 1 ].percentageChange ).toBeNaN();
                //expect( risingStars[0].persons[ 0 ].key ).toBe( 'Adam' );
                expect( risingStars[0].persons[ 0 ].percentageChange ).toBeNaN();

                expect( risingStars[2].key ).toBe( '02' );
                expect( risingStars[2].value ).toBe( 124 );
                expect( risingStars[2].percentageChange ).toBeCloseTo( 44.18604651162791 );
                expect( risingStars[2].persons[ 2 ].key ).toBe( 'Sauron' );
                expect( risingStars[2].persons[ 2 ].percentageChange ).toBeCloseTo( 75.86 );
                expect( risingStars[2].persons[ 1 ].key ).toBe( 'Julie' );
                expect( risingStars[2].persons[ 1 ].percentageChange ).toBeCloseTo( 32.2580645161 );
                expect( risingStars[2].persons[ 0 ].key ).toBe( 'Adam' );
                expect( risingStars[2].persons[ 0 ].percentageChange ).toBeCloseTo( 23.07692307692 );

                expect( risingStars[ 1 ]._debug.persons[ 'Sauron' ].key).toBe( 'Sauron' );
                expect( risingStars[ 1 ]._debug.persons[ 'Sauron' ].value).toBe( 48 );
                expect( risingStars[ 1 ]._debug.persons[ 'Sauron' ].prevKey).toBe( 'Sauron' );
                expect( risingStars[ 1 ]._debug.persons[ 'Sauron' ].prevValue).toBe( 51 );


                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].key).toBe( 'Sauron' );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].value).toBe( 29 );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].prevKey).toBe( 'None' );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].prevValue).toBe( 'None' );

            });


            it('supports sorting the iterationAccessor keys descending', function() {

                ma.orderByPercentageChange( -1 );

                risingStars = ma.top( Infinity );

                expect( risingStars[1].key ).toBe( '03' );
                expect( risingStars[1].value ).toBe( 101 );
                expect( risingStars[1].percentageChange ).toBeCloseTo( -18.54838 );
                expect( risingStars[1].persons[ 1 ].key ).toBe( 'Sauron' );
                expect( risingStars[1].persons[ 1 ].percentageChange ).toBeCloseTo( -5.88235294117647 );
                expect( risingStars[1].persons[ 2 ].key ).toBe( 'Julie' );
                expect( risingStars[1].persons[ 2 ].percentageChange ).toBeCloseTo( -60.97560975609756 );
                expect( risingStars[1].persons[ 0 ].key ).toBe( 'Adam' );
                expect( risingStars[1].persons[ 0 ].percentageChange ).toBeCloseTo( 15.625 );

                expect( risingStars[2].key ).toBe( '01' );
                expect( risingStars[2].value ).toBe( 86 );
                expect( risingStars[2].percentageChange ).toBeNaN();
                //expect( risingStars[2].persons[ 0 ].key ).toBe( 'Sauron' );
                expect( risingStars[2].persons[ 0 ].percentageChange ).toBeNaN();
                //expect( risingStars[2].persons[ 1 ].key ).toBe( 'Julie' );
                expect( risingStars[2].persons[ 1 ].percentageChange ).toBeNaN();
                //expect( risingStars[2].persons[ 2 ].key ).toBe( 'Adam' );
                expect( risingStars[2].persons[ 2 ].percentageChange ).toBeNaN();

                expect( risingStars[0].key ).toBe( '02' );
                expect( risingStars[0].value ).toBe( 124 );
                expect( risingStars[0].percentageChange ).toBeCloseTo( 44.18604651162791 );
                expect( risingStars[0].persons[ 0 ].key ).toBe( 'Sauron' );
                expect( risingStars[0].persons[ 0 ].percentageChange ).toBeCloseTo( 75.86 );
                expect( risingStars[0].persons[ 1 ].key ).toBe( 'Julie' );
                expect( risingStars[0].persons[ 1 ].percentageChange ).toBeCloseTo( 32.2580645161 );
                expect( risingStars[0].persons[ 2 ].key ).toBe( 'Adam' );
                expect( risingStars[0].persons[ 2 ].percentageChange ).toBeCloseTo( 23.07692307692 );

                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].key).toBe( 'Sauron' );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].value).toBe( 51 );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].prevKey).toBe( 'Sauron' );
                expect( risingStars[ 0 ]._debug.persons[ 'Sauron' ].prevValue).toBe( 29 );


                expect( risingStars[ 2 ]._debug.persons[ 'Sauron' ].key).toBe( 'Sauron' );
                expect( risingStars[ 2 ]._debug.persons[ 'Sauron' ].value).toBe( 29 );
                expect( risingStars[ 2 ]._debug.persons[ 'Sauron' ].prevKey).toBe( 'None' );
                expect( risingStars[ 2 ]._debug.persons[ 'Sauron' ].prevValue).toBe( 'None' );

            });

        });

    });


});
