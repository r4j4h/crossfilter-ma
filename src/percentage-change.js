
var crossfilterMA = crossfilterMA || {};

/**
 * Calculate the percentage change for a set of numbers
 *
 * TODO Remove date and make only iterative
 * TODO Make date centric that is less performant but works w/ unordered groups and redundant keyed groups
 *
 * @param {{all: Function, top: Function}} sourceGroup Crossfilter group
 * crossfilterMA.constants.DEFAULT_MOVING_AVERAGE_NODES if not provided.
 * @returns {{all: Function, top: Function}}
 */
crossfilterMA.accumulateGroupForPercentageChange = function( sourceGroup ) {
    if ( !sourceGroup || !sourceGroup.all || typeof sourceGroup.all !== 'function' ) {
        throw new Error( 'You must pass in a crossfilter group!' );
    }

    var keyAccessor = function( d ) {
        return d.key;
    };
    var valueAccessor = function( d ) {
        return d.value;
    };

    return {

        all: function () {

            var all = sourceGroup.all();
            var fullDates = {};

            var myDx = crossfilter( all );
            var myDimensionDate = myDx.dimension( function( d ) {
                return d.key;
            } );
            var myGroupingOnDate = myDimensionDate.group();

            var reducer = myGroupingOnDate.reduce(
                function ( p, v ) {
                    var selDate = keyAccessor( v );
                    var selValue = valueAccessor( v );

                    if ( fullDates[ selDate ] ) {
                        fullDates[ selDate ].myValue += selValue;
                    } else {
                        fullDates[ selDate ] = {
                            myValue: selValue
                        };
                    }
                    return p;
                },
                function ( p, v ) {
                    var selDate = keyAccessor( v );
                    var selValue = valueAccessor( v );

                    if ( fullDates[ selDate ] ) {
                        fullDates[ selDate ].quantity -= selValue;
                    } else {
                        delete fullDates[ selDate ];
                    }
                    return p;
                },
                function () {
                    fullDates = {};
                }
            );

            reducer.all();

            var accumulatedAll = all.map( function( d, i, arr ) {

                var thisDay = d;
                var prevDay = arr[i - 1];
                var perc = 0;

                if ( prevDay ) {
                    var diff = valueAccessor( thisDay ) - valueAccessor( prevDay );
                    var prop = diff / valueAccessor( prevDay );
                    perc = prop * 100;
                }

                return {
                    key: d.key,
                    value: d.value,
                    percentageChange: perc,
                    _debug: {
                        'thisDayKey': thisDay.key,
                        'thisDayValue': thisDay.value,
                        'prevDayKey': prevDay ? prevDay.key : 'None',
                        'prevDayValue': prevDay ? prevDay.value : 'None'
                    }
                };
            } );

            return accumulatedAll;
        },

        top: function() {

            var all = sourceGroup.top.apply( sourceGroup, arguments );
            var fullDates = {};

            var myDx = crossfilter( all );
            var myDimensionDate = myDx.dimension( function( d ) {
                return d.key;
            } );
            var myGroupingOnDate = myDimensionDate.group();

            var reducer = myGroupingOnDate.reduce(
                function ( p, v ) {
                    var selDate = keyAccessor( v );
                    var selValue = valueAccessor( v );

                    if ( fullDates[ selDate ] ) {
                        fullDates[ selDate ].myValue += selValue;
                    } else {
                        fullDates[ selDate ] = {
                            myValue: selValue
                        };
                    }
                    return p;
                },
                function ( p, v ) {
                    var selDate = keyAccessor( v );
                    var selValue = valueAccessor( v );

                    if ( fullDates[ selDate ] ) {
                        fullDates[ selDate ].quantity -= selValue;
                    } else {
                        delete fullDates[ selDate ];
                    }
                    return p;
                },
                function () {
                    fullDates = {};
                }
            );

            reducer.all();

            var accumulatedAll = all.map( function( d, i, arr ) {

                var thisDay = d;
                var perc = 0;

                var orderedDates = Object.keys( fullDates ).sort();
                var thisDayIndex = orderedDates.indexOf( keyAccessor( d ) );
                var prevDayId = orderedDates[ thisDayIndex - 1 ];
                var prevDayValue;

                if ( prevDayId ) {
                    var prevDayBlock = fullDates[ prevDayId ];
                    prevDayValue = prevDayBlock.myValue;

                    var diff = valueAccessor( thisDay ) - prevDayValue;
                    var prop = diff / prevDayValue;
                    perc = prop * 100;
                }

                return {
                    key: d.key,
                    value: d.value,
                    percentageChange: perc,
                    _debug: {
                        'thisDayKey': thisDay.key,
                        'thisDayValue': thisDay.value,
                        'prevDayKey': prevDayId ? prevDayId : 'None',
                        'prevDayValue': prevDayId ? prevDayValue : 'None'
                    }
                };
            } );

            return accumulatedAll;

        }
    };
};
