describe('a cleaned up tests for percentage change    ', function() {

    describe('all', function() {

        var rawMockDataChunk,
            crossfilter,
            stuff;

        beforeEach(function() {

            // What are some good dummy data dimensions?

                // date
                // visits
                // name
                // duration
                // reason / membership / company name

            rawMockDataChunk = [
                { date: "2007-01-04", gauge: 1, inches: 2.13 },
                { date: "2007-01-06", gauge: 1, inches: 0.84 },
                { date: "2007-01-14", gauge: 1, inches: 3.5 },
                { date: "2007-01-15", gauge: 1, inches: 0.42 },
                { date: "2007-01-18", gauge: 1, inches: 0.05 },
                { date: "2007-01-20", gauge: 1, inches: 0.76 },
                { date: "2007-01-04", gauge: 2, inches: 2.25 },
                { date: "2007-01-06", gauge: 2, inches: 0.755 },
                { date: "2007-01-14", gauge: 2, inches: 3 },
                { date: "2007-01-15", gauge: 2, inches: 0.39 },
                { date: "2007-01-18", gauge: 2, inches: 0.05 },
                { date: "2007-01-20", gauge: 2, inches: 0.8 },
                { date: "2007-01-04", gauge: 3, inches: 2.42 },
                { date: "2007-01-06", gauge: 3, inches: 0.8 },
                { date: "2007-01-14", gauge: 3, inches: 3.5 },
                { date: "2007-01-15", gauge: 3, inches: 0.42 },
                { date: "2007-01-18", gauge: 3, inches: 0.05 },
                { date: "2007-01-20", gauge: 3, inches: 0.73 },
                { date: "2007-01-04", gauge: 4, inches: 2.08 },
                { date: "2007-01-06", gauge: 4, inches: 0.83 },
                { date: "2007-01-14", gauge: 4, inches: 4 },
                { date: "2007-01-15", gauge: 4, inches: 0.38 },
                { date: "2007-01-18", gauge: 4, inches: 0.05 },
                { date: "2007-01-20", gauge: 4, inches: 0.72 },
                { date: "2007-01-04", gauge: 5, inches: 2.29 },
                { date: "2007-01-06", gauge: 5, inches: 0.77 },
                { date: "2007-01-14", gauge: 5, inches: 4 },
                { date: "2007-01-15", gauge: 5, inches: 0.5 },
                { date: "2007-01-18", gauge: 5, inches: 0.05 },
                { date: "2007-01-20", gauge: 5, inches: 0.75 }
            ];

        });

        afterEach(function() {

            rawMockDataChunk = null;
            crossfilter = null;

        });


        it('supports calculating on value', function() {

        });

        describe('ordering', function() {

            describe('without nested data', function() {

                it('supports maintaining original group ordering', function() {});

                it('supports ordering group by percentage change', function() {});

            });

            describe('nested data', function() {

                it('supports maintaining original group ordering while maintaining nested data', function() {});

                it('supports ordering group by percentage change while maintaining nested data', function() {});

            });

            describe('ordering nested data', function() {

                it('supports maintaining original group ordering while ordering nested data by percentage change', function() {});

                it('supports ordering group by percentage change while ordering nested data by percentage change', function() {});

            });

        });

        describe('NaN values', function() {

            describe('without nested data', function() {

                it('supports sorting NaN values before or after sorted values', function() {});

                it('supports culling NaN values from sorted results', function() {});

            });

            describe('Nested NaN values', function() {

                it('supports sorting NaN values before or after sorted values', function() {});

                it('supports culling NaN values from sorted nested results', function() {});

            });

        });

        describe('for good integration with crossfilter', function() {

            it('maintains breaks in data', function() {});

            it('supports redundant days in data', function() {});

            it('properly handles calculating nested values with custom valueAccessors on the original group', function() {});

        });

    });

});
