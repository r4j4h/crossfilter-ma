crossfilter.ma
=====

crossfilter.ma is a [_crossfilter group_ modifier](https://github.com/dc-js/dc.js/wiki/FAQ#filter-the-data-before-its-charted)
to calculate _moving averages_ and _percent change_.

It is intended for time oriented data, but can be used for non-dates just as well as it is powered
by [JavaScript's native Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) to get the keys in order to determine previous nodes for
the calculations.


How to Install
=====

- Ensure requirements are provided on your page
  - crossfilter
- Copy `crossfilter.ma.js` to your scripts directory and provide it on your page
- Use it!


How to Use
=====

Index
- [Calculating a Rolling/Moving Average](#calculating-a-rollingmoving-average)
- [Calculating Percent Change](#calculating-percent-change)
- [Complex Data / Grouping](#complex-data--grouping)


Calculating a Rolling/Moving Average
----

```javascript
// Get reference
var crossfilterMa = crossfilter$ma;             // Both variables work and are identical.
var crossfilterMa = window['crossfilter-ma'];   // Providing both b/c GitHub naming and convenience impedence mismatch.

// Replace with your data
var data = [
    { date: "2012-01-11", visits: 2  }, // 2 point  | 3 point
    { date: "2012-01-12", visits: 3  }, // 2.5      | null
    { date: "2012-01-13", visits: 10 }, // 6.5      | 5
    { date: "2012-01-14", visits: 3  }, // 6.5      | 5.333
    { date: "2012-01-15", visits: 10 }, // 6.5      | 7.666
    { date: "2012-01-16", visits: 12 }, // 11       | 8.333
    { date: "2012-01-17", visits: 7  }  // 9.5      | 9.666
];
// Build crossfilter on it
var data = crossfilter(data);
// Build crossfilter dimension
var dim = data.dimension(function (d) {
    return d.date
});
// Build crossfilter group
var group = dim.group().reduceSum( function(d) { return d.visits; } );



// Get a 3 day moving average on group
var rollingAverageFakeGroup = crossfilterMa.accumulateGroupForNDayMovingAverage( group, 3 );

// Get results with current crossfilter filtering applied
var resultsWithRollingAverages = rollingAverageFakeGroup.all();

// Use result
/*
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
*/


// Supports changing the number of days
rollingAverageFakeGroup.ndays(2);

// Get results with current crossfilter filtering applied
var resultsWithRollingAverages = rollingAverageFakeGroup.all();

// Use result
/*
expect( resultsWithRollingAverages[0].key ).toBe( '2012-01-11' );
expect( resultsWithRollingAverages[0].value ).toBe( 2 );
expect( resultsWithRollingAverages[0].rollingAverage ).toBe( 0 ); // 2 by itself is not a rolling average

expect( resultsWithRollingAverages[1].key ).toBe( '2012-01-12' );
expect( resultsWithRollingAverages[1].value ).toBe( 3 );
expect( resultsWithRollingAverages[1].rollingAverage ).toBe( 2.5 );
*/


rollingAverageFakeGroup.ndays(3); // (resetting back to 3 for sake of example)



// Supports rolldown
rollingAverageFakeGroup.rolldown(true);

// Get results with current crossfilter filtering applied
var resultsWithRollingAverages = rollingAverageFakeGroup.all();

// Now our result includes averages on data points where a 3 day average is not possible:
/*
expect( resultsWithRollingAverages[0].key ).toBe( '2012-01-11' );
expect( resultsWithRollingAverages[0].value ).toBe( 2 );
expect( resultsWithRollingAverages[0].rollingAverage ).toBe( 2 ); // This averages with itself now

expect( resultsWithRollingAverages[1].key ).toBe( '2012-01-12' );
expect( resultsWithRollingAverages[1].value ).toBe( 3 );
expect( resultsWithRollingAverages[1].rollingAverage ).toBe( 2.5 ); // This is a 2 day average

expect( resultsWithRollingAverages[2].key ).toBe( '2012-01-13' );
expect( resultsWithRollingAverages[2].value ).toBe( 10 );
expect( resultsWithRollingAverages[2].rollingAverage ).toBe( 5 ); // And we proceed with our 3 days...
expect( resultsWithRollingAverages[3].rollingAverage ).toBeCloseTo( 5.333333333333333 );
*/


// Supports a debug mode to see the values used in calculations
rollingAverageFakeGroup._debug(true);

// Regenerate results
var resultsWithRollingAverages = rollingAverageFakeGroup.all();

// Now our results include debugging information..
/*
expect( resultsWithRollingAverages[0]._debug ).toBeDefined();
*/

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



// We can also sort by moving average
rollingAverageFakeGroup.orderByMovingAverage( 1 ); // Ascending
rollingAverageFakeGroup.orderByMovingAverage( -1 ); // Descending

resultsWithRollingAverages = rollingAverageFakeGroup.all();

/*
expect( resultsWithRollingAverages[ 0 ].rollingAverage ).toBeCloseTo( 9.66666 );
*/

```

[Back to Top](#crossfilterma)

Calculating Percent Change
---

```javascript
// Get reference
var crossfilterMa = crossfilter$ma;             // Both variables work and are identical.
var crossfilterMa = window['crossfilter-ma'];   // Providing both b/c GitHub naming and convenience impedence mismatch.

// Replace with your data
var data = [
    { date: "2012-01-11", visits: 2  },
    { date: "2012-01-12", visits: 3  },
    { date: "2012-01-13", visits: 10 },
    { date: "2012-01-14", visits: 3  },
    { date: "2012-01-15", visits: 10 },
    { date: "2012-01-16", visits: 12 },
    { date: "2012-01-17", visits: 7  }
];
// Build crossfilter on it
var data = crossfilter(data);
// Build crossfilter dimension
var dim = data.dimension(function (d) {
    return d.date
});
// Build crossfilter group
var group = dim.group().reduceSum( function(d) { return d.visits; } );



// Get values with Percent Change
var pc = crossfilterMa.accumulateGroupForPercentageChange( group );

// Get results with current crossfilter filtering applied
var results = pc.all();




// Use result
/*
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
*/



// Supports debug mode
// var pc = crossfilterMa.accumulateGroupForPercentageChange( group, true ); // Enabling via constructor
pc._debug( true ); // Enabling via method

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



// We can also sort by percentage change
pc.orderByPercentageChange( 1 ); // Ascending
pc.orderByPercentageChange( -1 ); // Descending

resultsAll = pc.all();

/*
expect( resultsAll[ 0 ].percentageChange ).toBe( 233.33333333333334 );
*/

```

[Back to Top](#crossfilterma)

Complex Data / Grouping
----

Custom Key/Value accessors

```javascript
// Get reference
var crossfilterMa = crossfilter$ma;             // Both variables work and are identical.
var crossfilterMa = window['crossfilter-ma'];   // Providing both b/c GitHub naming and convenience impedence mismatch.

// Prepare more complex data
setOfNumbers = [
    { date: "2012-01-11", visits: 2,  place: "A", territory: "A" },
    { date: "2012-01-12", visits: 3,  place: "B", territory: "A" },
    { date: "2012-01-13", visits: 10, place: "A", territory: "B" },
    { date: "2012-01-11", visits: 3,  place: "C", territory: "B" },
    { date: "2012-01-15", visits: 10, place: "A", territory: "A" },
    { date: "2012-01-12", visits: 12, place: "B", territory: "A" },
    { date: "2012-01-13", visits: 7,  place: "A", territory: "B" }
];

// Crossfilter it
crossfilterInstance = crossfilter( setOfNumbers );

dimensionDate = crossfilterInstance.dimension(function (d) {
    return d.date
});

// Since we are missing entries for some data points on some days (place C is only present on the 11th)
// We want to fill in everyone with 0, so let's gather the dimensions we want to do this on.
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

// Now let's use that group with crossfilter$ma
percentageChangeGroup = crossfilterMa.accumulateGroupForPercentageChange( groupVisitsByPlaceAndTerritoryByDate );
percentageChangeGroup._debug(true);

var resultsAll = percentageChangeGroup.all();

// Our reduce function's `value` is no longer a primitive, but an object, so this is going to mess up...
expect( resultsAll[ 0 ].percentageChange ).toBe( 0 );
expect( resultsAll[ 0 ].percentageChange ).not.toBe( 1 );
expect( resultsAll[ 1 ].percentageChange ).toBeNaN();
expect( resultsAll[ 1 ].percentageChange ).not.toBe( 200 );
expect( resultsAll[ 2 ].percentageChange ).toBeNaN();
expect( resultsAll[ 2 ].percentageChange ).not.toBe( 13.33 );
expect( resultsAll[ 3 ].percentageChange ).toBeNaN();
expect( resultsAll[ 3 ].percentageChange ).not.toBe( 41.18 );

// Let's inform crossfilter$ma to look deeper into that object for the totalVisits property
percentageChangeGroup.valueAccessor( function(d) { return d.value.totalVisits; } );
groupVisitsByPlaceAndTerritoryByDate.order( function(d) { return d.totalVisits; } );

resultsAll = percentageChangeGroup.all();

// Now we've got our expected data!
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


// We can also still sort by percentage change
percentageChangeGroup.orderByPercentageChange( 1 ); // Ascending
percentageChangeGroup.orderByPercentageChange( -1 ); // Descending

resultsAll = percentageChangeGroup.all();

expect( resultsAll[ 0 ].percentageChange ).toBe( 200 );



```

[Back to Top](#crossfilterma)


How to Test
=====

Tests can be run via CLI using Jasmine or in the browser.

- Run `grunt test` to test in the CLI.
- Run `grunt server` and visit `http://0.0.0.0:8888/spec/` in your browser to run in browser.


How to Test Code Coverage
====

- Run `grunt coverage`
- Run `grunt server` and visit `http://0.0.0.0:8888/coverage/jasmine/`



[Back to Top](#crossfilterma)


Inspired By
=====

- [dc.js](https://github.com/dc-js/dc.js)
  - [Specifically this portion of the FAQ](https://github.com/dc-js/dc.js/wiki/FAQ#filter-the-data-before-its-charted)
- [reductio](https://github.com/esjewett/reductio)
  - An approach towards averages on crossfilter groups
- [crossfilter](https://github.com/square/crossfilter)
- [d3](https://github.com/mbostock/d3)


Thanks for reading! :o)
