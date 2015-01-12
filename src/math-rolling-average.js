var crossfilterMA = crossfilterMA || {};

/**
 * Calculate the average of a set of numbers
 *
 * TODO Remove date and make only iterative
 * TODO Make date centric that is less performant but works w/ unordered groups and redundant keyed groups
 *
 * @param {{all: Function, top: Function}} sourceGroup Crossfilter group
 * @param {Number} [ndays] Number of datapoints for moving average. Defaults to the current value of
 * crossfilterMA.constants.DEFAULT_MOVING_AVERAGE_NODES if not provided.
 * @returns {{all: Function, top: Function}}
 */
crossfilterMA.accumulateGroupForNDayMovingAverage = function( sourceGroup, ndays ) {
    if ( !sourceGroup || !sourceGroup.all || typeof sourceGroup.all !== 'function' ) {
        throw new Error( 'You must pass in a crossfilter group!' );
    }

    // Handle defaults
    ndays = ( typeof ndays !== 'undefined' ) ? ndays : crossfilterMA.constants.DEFAULT_MOVING_AVERAGE_NODES;

    var keyAccessor = function( d ) {
        return d.key;
    };
    var valueAccessor = function( d ) {
        return d.value;
    };

    return {

        /**
         * Set or get the number of units used in the moving/rolling average calculation.
         *
         * @param {Number} [_]
         * @returns {Number}
         */
        ndays: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                return ndays;
            }
            ndays = _;
        },

        all: function () {
            var cumulate = 0;
            var all = sourceGroup.all();
            var accumulatedAll = all.map( function( d, i, arr ) {

                // find previous n days
                var days = ndays;

                var numsToAverage = 0;
                var thisCumulate = 0;
                var thisAverage = 0;

                var thisResult = [];

                while ( --days > 0 ) {
                    var targetDay =  arr[i - days];
                    if ( targetDay ) {


                        //var momentedDate = moment( d.key );
                        //momentedDate.subtract( thisDay, 'hours' );
                        //myDimensionDate.filterExact( batchYear( momentedDate ) );
                        //var thisDaysTotals = myDimensionDate.top( 1 );
                        //var thisDaysTotals = sourceGroup.top( 1 );
                        numsToAverage++;
                        thisCumulate += targetDay.value;
                        thisResult.push( { 'key': targetDay.key, 'value': targetDay.value } );

                    }
                }

                numsToAverage++;
                thisCumulate += d.value;

                cumulate += d.value;
                thisResult.push( { 'key': d.key, 'value': d.value } );

                thisAverage = thisCumulate / numsToAverage;

                return {
                    key: d.key,
                    value: d.value,
                    rollingAverage: thisAverage,
                    _debug: {
                        'cumulate': cumulate,
                        thisResult: thisResult
                    }
                };
            } );

            return accumulatedAll;
        },

        top: function() {
            var cumulate = 0;
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

                var orderedDates = Object.keys( fullDates ).sort();
                var thisDayIndex = orderedDates.indexOf( keyAccessor( d ) );

                // find previous n-1 days
                var days = ndays;

                var numsToAverage = 0;
                var thisCumulate = 0;
                var thisAverage = 0;

                var thisResult = [];

                while ( --days > 0 ) {
                    //var targetDay =  arr[i - thisDay];
                    var targetDayId = orderedDates[ thisDayIndex - days ];

                    if ( targetDayId ) {
                        var targetDayBlock = fullDates[ targetDayId ];
                        var targetDayValue = targetDayBlock.myValue;

                        numsToAverage++;
                        thisCumulate += targetDayValue;
                        thisResult.push( { 'key': targetDayId, 'value': targetDayValue } );
                    }
                }

                numsToAverage++;
                thisCumulate += d.value;


                cumulate += d.value;
                thisResult.push( { 'key': d.key, 'value': d.value } );

                thisAverage = thisCumulate / numsToAverage;

                return {
                    key: d.key,
                    value: d.value,
                    rollingAverage: thisAverage,
                    _debug: {
                        'cumulate': cumulate,
                        thisResult: thisResult
                    }
                };
            } );

            return accumulatedAll;
        }
    };
};
