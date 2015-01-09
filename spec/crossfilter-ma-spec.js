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

    describe('calculates moving averages', function() {

        beforeEach(function() {

        });

        afterEach(function() {

        });

        it('calculates the normal average', function() {

            var data = [
                {date: "2011-11-14T16:17:54Z", quantity: 2, total: 190, tip: 100, type: "tab"},
                {date: "2011-11-14T16:20:19Z", quantity: 2, total: 190, tip: 100, type: "tab"},
                {date: "2011-11-14T16:28:54Z", quantity: 1, total: 300, tip: 200, type: "visa"},
                {date: "2011-11-14T16:30:43Z", quantity: 2, total: 90, tip: 0, type: "tab"},
                {date: "2011-11-14T16:48:46Z", quantity: 2, total: 90, tip: 0, type: "tab"},
                {date: "2011-11-14T16:53:41Z", quantity: 2, total: 90, tip: 0, type: "tab"},
                {date: "2011-11-14T16:54:06Z", quantity: 1, total: 100, tip: 0, type: "cash"},
                {date: "2011-11-14T16:58:03Z", quantity: 2, total: 90, tip: 0, type: "tab"},
                {date: "2011-11-14T17:07:21Z", quantity: 2, total: 90, tip: 0, type: "tab"},
                {date: "2011-11-14T17:22:59Z", quantity: 2, total: 90, tip: 0, type: "tab"},
                {date: "2011-11-14T17:25:45Z", quantity: 2, total: 200, tip: 0, type: "cash"},
                {date: "2011-11-14T17:29:52Z", quantity: 1, total: 200, tip: 100, type: "visa"}
            ];

            var wiringObject = {
                data: {
                    rawData: null,
                    dimensions: {
                        date: null,
                        dateChunkedForReductio: null
                    },
                    groups: {
                        actualTotalsByDate: null,
                        averageTotalsByDate: null,
                        movingAverage2DayByDate: null
                    }
                },
                charts: {
                    actualLineChart: null,
                    averageLineChart: null,
                    movingAverage2DayLineChart: null,
                    topTimeScrubberChart: null,
                    bottomTimeScrubberChart: null
                },
                inputs: {
                    genNewData: null,
                    alterCurrentData: null,
                    averageRangeSelection: null
                }
            };

// Populate data

            var preparedData = data.map(function(datum, idx) {
                datum.date = new Date( datum.date );
                return datum;
            });

// Prepare data, dimensions, and groups
            var sharedDx = crossfilter(preparedData);

            var dateDim = sharedDx.dimension(function (d) {
                return d.date
            });
            var totalsByDate = dateDim.group().reduceSum( function(d) { return d.total; } );
            wiringObject.data.dimensions.date = dateDim;

            var batchYear = function(momentDate) {
                return momentDate.getYear() + '-' + momentDate.getMonth() + '-' + momentDate.getHours();
            };

            var dateDimForReductio = sharedDx.dimension(function (d) {
                var momentedDate = new Date( d.date );
                d.dateBatch = batchYear( momentedDate );
                return d.dateBatch;
            });
            wiringObject.data.dimensions.dateChunkedForReductio = dateDimForReductio;
            var dateDimForFilteringReductio = sharedDx.dimension(function (d) {
                var momentedDate = new Date( d.date );
                d.dateBatch = batchYear( momentedDate );
                return d.dateBatch;
            });
            wiringObject.data.dimensions.dateChunkedForFilteringReductio = dateDimForFilteringReductio;

            var totalsByReductioDateChunk = dateDimForReductio.group().reduceSum( function(d) { return d.total; } );
            wiringObject.data.groups.actualTotalsByDate = totalsByReductioDateChunk;

            var groupForReductio = dateDimForReductio.group();

            var quantityAccessor = function() { return function(d) { return d.quantity; }; };
            var totalsAccessor = function() { return function(d) { return d.total; }; };





            function accumulate_group_for_2day_moving_average(source_group) {
                return {
                    all:function () {
                        var cumulate = 0;
                        var result = [];
                        var all = source_group.all();
                        console.log( 'test', source_group, all );
                        var all2 = all.map(function(d, i, arr) {

                            // find previous 2 days
                            var days = 2;
                            var thisDay = 0;

                            // let A be their totals and today's total summed together
                            // let B be A divided by 3 ( for the 2 previous days and today )

                            // B is the 2 day moving average of today


                            // Make a crossfilter of our full array of data


                            var myDx = crossfilter( all );

                            var myDimensionDate = myDx.dimension(function(d) {
                                return d.key;
                            });


                            //while ( thisDay++ < days ) {
                            //    console.log( 'arf', thisDay );
                            //    var momentedDate = moment( d.key );
                            //    momentedDate.subtract( thisDay, 'hours' );
                            //    myDimensionDate.filterExact( batchYear( momentedDate ) );
                            //    var thisDaysTotals = myDimensionDate.top( 1 );
                            //    //var thisDaysTotals = source_group.top( 1 );
                            //    cumulate += thisDaysTotals.value;
                            //    result.push( {  'day': thisDay, batchYear:  batchYear( momentedDate ), 'key': thisDaysTotals.key, 'value': thisDaysTotals.value } );
                            //}




                            cumulate += d.value;
                            result.push( { 'key': d.key, 'value': d.value } );

                            return {
                                key: d.key,
                                value:{
                                    'cumulate': cumulate,
                                    'result': result
                                }
                            };
                        });

                        return all2;
                    },
                    top: function() {
                        var cumulate = 0;
                        var result = [];
                        return source_group.top.apply( source_group, arguments ).map(function(d, i, arr) {
                            console.log(this, arguments);
                            cumulate += d.value;
                            result.push( { 'key': d.key, 'value': d.value } );
                            return {
                                key: d.key,
                                value:{
                                    'cumulate': cumulate,
                                    'result': result
                                }
                            };
                        });
                    }
                };
            }

            var rollingAverageFakeGroup = accumulate_group_for_2day_moving_average( wiringObject.data.groups.actualTotalsByDate );

            var results = rollingAverageFakeGroup.all();

            expect( results[0].key ).toBe( '123' );

        });

        it('calculates a 2 day moving average', function() {

        });

    });

});