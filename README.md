crossfilter.ma
=====

crossfilter.ma is a _crossfilter group_ modifier (in _reductio_-like fashion) to calculate _moving averages_.

How to Install
----

- Ensure requirements are provided on your page
  - crossfilter
  - reductio
- Copy `crossfilter.ma.js` to your scripts directory and provide it on your page
- Use it!

How to Use
----

Here's a starting example:


```
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

var preparedData = $.map(data, function(datum, idx) {
    datum.date = moment(datum.date ).toDate();
    return datum;
});

// Prepare data, dimensions, and groups
var sharedDx = crossfilter(preparedData);

var dateDim = sharedDx.dimension(function (d) {
    return d.date
});
var totalsByDate = dateDim.group().reduceSum(dc.pluck('total'));
wiringObject.data.dimensions.date = dateDim;

var batchYear = function(momentDate) {
    return momentDate.year() + '-' + momentDate.month() + '-' + momentDate.hour();
};

var dateDimForReductio = sharedDx.dimension(function (d) {
    var momentedDate = moment( d.date );
    d.dateBatch = batchYear( momentedDate );
    return d.dateBatch;
});
wiringObject.data.dimensions.dateChunkedForReductio = dateDimForReductio;
var dateDimForFilteringReductio = sharedDx.dimension(function (d) {
    var momentedDate = moment( d.date );
    d.dateBatch = batchYear( momentedDate );
    return d.dateBatch;
});
wiringObject.data.dimensions.dateChunkedForFilteringReductio = dateDimForFilteringReductio;

var totalsByReductioDateChunk = dateDimForReductio.group().reduceSum(dc.pluck('total'));
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

                debugger;


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

            debugger;

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

```

How to Test
----

Run `grunt test`.
