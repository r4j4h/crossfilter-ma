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
    // Handle defaults
    ndays = ( typeof ndays !== 'undefined' ) ? ndays : crossfilterMA.constants.DEFAULT_MOVING_AVERAGE_NODES;
    return {

        all: function () {
            var cumulate = 0;
            var result = [];
            var all = sourceGroup.all();
            var accumulatedAll = all.map( function( d, i, arr ) {

                // find previous 2 days
                var days = ndays - 1;
                var thisDay = 0;

                var numsToAverage = 0;
                var thisCumulate = 0;
                var thisAverage = 0;

                var thisResult = [];

                // let A be their totals and today's total summed together
                // let B be A divided by 3 ( for the 2 previous days and today )

                // B is the 2 day moving average of today


                // Make a crossfilter of our full array of data


                //var myDx = crossfilter( all );
                //
                //var myDimensionDate = myDx.dimension(function(d) {
                //    return d.key;
                //} );


                while ( thisDay++ < days ) {
                    var targetDay =  arr[i - thisDay];
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

                thisAverage = thisCumulate / numsToAverage;

                cumulate += d.value;
                thisResult.push( { 'key': d.key, 'value': d.value } );
                result.push( { 'key': d.key, 'value': d.value } );

                return {
                    key: d.key,
                    value: thisAverage,
                    debug: {
                        'cumulate': cumulate,
                        thisResult: thisResult,
                        'result': result
                    }
                };
            } );

            return accumulatedAll;
        },

        top: function() {
            var cumulate = 0;
            var result = [];
            return sourceGroup.top.apply( sourceGroup, arguments ).map( function( d, i, arr ) {
                cumulate += d.value;
                result.push( { 'key': d.key, 'value': d.value } );
                return {
                    key: d.key,
                    value: {
                        'cumulate': cumulate,
                        'result': result
                    }
                };
            } );
        }
    };
};
