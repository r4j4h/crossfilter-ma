crossfilter.ma
=====

crossfilter.ma is a [_crossfilter group_ modifier](https://github.com/dc-js/dc.js/wiki/FAQ#filter-the-data-before-its-charted) to calculate _moving averages_.


How to Install
----

- Ensure requirements are provided on your page
  - crossfilter
  - reductio
- Copy `crossfilter.ma.js` to your scripts directory and provide it on your page
- Use it!


How to Use
----

Calculating a Rolling/Moving Average
----

```javascript
var crossfilterMa = window['crossfilter-ma'];
var data = [
    { date: "2012-01-11", visits: 2  }, // 2 point  | 3 point
    { date: "2012-01-12", visits: 3  }, // 2.5      | null
    { date: "2012-01-13", visits: 10 }, // 6.5      | 5
    { date: "2012-01-14", visits: 3  }, // 6.5      | 5.333
    { date: "2012-01-15", visits: 10 }, // 6.5      | 7.666
    { date: "2012-01-16", visits: 12 }, // 11       | 8.333
    { date: "2012-01-17", visits: 7  }  // 9.5      | 9.666
];
var data = crossfilter(data);
var dim = data.dimension(function (d) {
    return d.date
});
var group = dim.group().reduceSum( function(d) { return d.visits; } );



// Get a 3 day moving average
var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( group, 3 );

// Get results with current crossfilter filtering applied
var resultsWithRollingAverages = rollingAverageFakeGroup.all();

// Use result
expect( resultsWithRollingAverages[0].key ).toBe( '2012-01-11' );
expect( resultsWithRollingAverages[0].value ).toBe( 2 );
expect( resultsWithRollingAverages[0].rollingAverage ).toBe( 0 ); // 2 by itself is not a rolling average

expect( resultsWithRollingAverages[1].key ).toBe( '2012-01-12' );
expect( resultsWithRollingAverages[1].value ).toBe( 3 );
expect( resultsWithRollingAverages[1].rollingAverage ).toBe( 0 ); // 2.5 is a 2 day average, not enough data for 3

expect( resultsWithRollingAverages[2].key ).toBe( '2012-01-13' );
expect( resultsWithRollingAverages[2].value ).toBe( 10 );
expect( resultsWithRollingAverages[2].rollingAverage ).toBe( 5 ); // And here we go

expect( resultsWithRollingAverages[3].key ).toBe( '2012-01-14' );
expect( resultsWithRollingAverages[3].value ).toBe( 3 );
expect( resultsWithRollingAverages[3].rollingAverage ).toBe( 5.333333333333333 );

expect( resultsWithRollingAverages[4].key ).toBe( '2012-01-15' );
expect( resultsWithRollingAverages[4].value ).toBe( 10 );
expect( resultsWithRollingAverages[4].rollingAverage ).toBe( 7.666666666666667 );

expect( resultsWithRollingAverages[5].key ).toBe( '2012-01-15' );
expect( resultsWithRollingAverages[5].value ).toBe( 12 );
expect( resultsWithRollingAverages[5].rollingAverage ).toBe( 8.333333333333334 );

expect( resultsWithRollingAverages[6].key ).toBe( '2012-01-15' );
expect( resultsWithRollingAverages[6].value ).toBe( 7 );
expect( resultsWithRollingAverages[6].rollingAverage ).toBe( 9.666666666666666 );



// Supports changing the number of days
rollingAverageFakeGroup.ndays(2);

// Get results with current crossfilter filtering applied
var resultsWithRollingAverages = rollingAverageFakeGroup.all();

// Use result
expect( resultsWithRollingAverages[0].key ).toBe( '2012-01-11' );
expect( resultsWithRollingAverages[0].value ).toBe( 2 );
expect( resultsWithRollingAverages[0].rollingAverage ).toBe( 0 ); // 2 by itself is not a rolling average

expect( resultsWithRollingAverages[1].key ).toBe( '2012-01-12' );
expect( resultsWithRollingAverages[1].value ).toBe( 3 );
expect( resultsWithRollingAverages[1].rollingAverage ).toBe( 2.5 );



rollingAverageFakeGroup.ndays(3); // (resetting back to 3 for sake of example)



// Supports rolldown
rollingAverageFakeGroup.rolldown(true);

// Get results with current crossfilter filtering applied
var resultsWithRollingAverages = rollingAverageFakeGroup.all();

// Now our result includes averages on data points where a 3 day average is not possible:
expect( resultsWithRollingAverages[0].key ).toBe( '2012-01-11' );
expect( resultsWithRollingAverages[0].value ).toBe( 2 );
expect( resultsWithRollingAverages[0].rollingAverage ).toBe( 2 ); // This averages with itself now

expect( resultsWithRollingAverages[1].key ).toBe( '2012-01-12' );
expect( resultsWithRollingAverages[1].value ).toBe( 3 );
expect( resultsWithRollingAverages[1].rollingAverage ).toBe( 2.5 ); // This is a 2 day average

expect( resultsWithRollingAverages[2].key ).toBe( '2012-01-13' );
expect( resultsWithRollingAverages[2].value ).toBe( 10 );
expect( resultsWithRollingAverages[2].rollingAverage ).toBe( 5 ); // And we proceed with our 3 days...
expect( resultsWithRollingAverages[3].rollingAverage ).toBe( 5.333333333333333 );



// Supports a debug mode to see the values used in calculations
rollingAverageFakeGroup._debug(true);

// Regenerate results
var resultsWithRollingAverages = rollingAverageFakeGroup.all();

// Now our results include debugging information..
expect( resultsWithRollingAverages[0]._debug ).toBeDefined();

/*
resultsWithRollingAverages[2] = {
    "key": "2012-01-13",
    "value": 10,
    "rollingAverage": 5,
    "_debug": {
        "cumulate": 15,
        "datumsUsed": [
            {
                "key": "2012-01-11",
                "value": 2
            },
            {
                "key": "2012-01-12",
                "value": 3
            },
            {
                "key": "2012-01-13",
                "value": 10
            }
        ]
    }
}
*/

```



Calculating Percent Change
---

```javascript
var data = [
    { date: "2012-01-11", visits: 2  },
    { date: "2012-01-12", visits: 3  },
    { date: "2012-01-13", visits: 10 },
    { date: "2012-01-14", visits: 3  },
    { date: "2012-01-15", visits: 10 },
    { date: "2012-01-16", visits: 12 },
    { date: "2012-01-17", visits: 7  }
];
var data = crossfilter(data);
var dim = data.dimension(function (d) {
    return d.date
});
var group = dim.group().reduceSum( function(d) { return d.visits; } );

// Get values with Percent Change
var pc = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate );

// Get results with current crossfilter filtering applied
var results = pc.all();




// Use result
expect( results[0].key ).toBe( '2012-01-11' );
expect( results[0].value ).toBe( 2 );
expect( results[0].percentageChange ).toBe( 0 );
expect( results[0]._debug.thisDayKey ).toBe( '2012-01-11' );
expect( results[0]._debug.prevDayKey ).toBe( 'None' );

expect( results[1].key ).toBe( '2012-01-12' );
expect( results[1].value ).toBe( 3 );
expect( results[1].percentageChange ).toBe( 50 );
expect( results[1]._debug.thisDayKey ).toBe( '2012-01-12' );
expect( results[1]._debug.prevDayKey ).toBe( '2012-01-11' );

expect( results[2].key ).toBe( '2012-01-13' );
expect( results[2].value ).toBe( 10 );
expect( results[2].percentageChange ).toBe( 233.33333333333334 );
expect( results[2]._debug.thisDayKey ).toBe( '2012-01-13' );
expect( results[2]._debug.prevDayKey ).toBe( '2012-01-12' );

expect( results[3].key ).toBe( '2012-01-14' );
expect( results[3].value ).toBe( 10 );
expect( results[3].percentageChange ).toBe( -70 );
expect( results[3]._debug.thisDayKey ).toBe( '2012-01-14' );
expect( results[3]._debug.prevDayKey ).toBe( '2012-01-13' );

expect( results[4].key ).toBe( '2012-01-15' );
expect( results[4].value ).toBe( 10 );
expect( results[4].percentageChange ).toBe( 233.33333333333334 );

expect( results[5].key ).toBe( '2012-01-16' );
expect( results[5].value ).toBe( 12 );
expect( results[5].percentageChange ).toBe( 20 );

expect( results[6].key ).toBe( '2012-01-17' );
expect( results[6].value ).toBe( 7 );
expect( results[6].percentageChange ).toBe( -41.66666666666667 );




// Supports debug mode
var pc = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByDate, true );

// Regenerate results w/ debug mode on
var results = pc.all();

/*
results = [
    {
        "key": "2012-01-11",
        "value": 2,
        "percentageChange": 0,
        "_debug": {
            "thisDayKey": "2012-01-11",
            "thisDayValue": 2,
            "prevDayKey": "None",
            "prevDayValue": "None"
        }
    },
    {
        "key": "2012-01-11",
        "value": 3,
        "percentageChange": 50,
        "_debug": {
            "thisDayKey": "2012-01-12",
            "thisDayValue": 3,
            "prevDayKey": "2012-01-11",
            "prevDayValue": 2
        }
    },
    ...
]
*/

```

How to Test
----

- Run `grunt test`.
- Run `grunt server` and visit `http://0.0.0.0:8888/spec/`
- Run `grunt coverage` and then `grunt server` and visit `http://0.0.0.0:8888/coverage/


Inspired By
----

- [dc.js](https://github.com/dc-js/dc.js)
  - [Specifically this portion of the FAQ](https://github.com/dc-js/dc.js/wiki/FAQ#filter-the-data-before-its-charted)
- [reductio](https://github.com/esjewett/reductio)
  - An approach towards averages on crossfilter groups
- [crossfilter](https://github.com/square/crossfilter)
- [d3](https://github.com/mbostock/d3)
