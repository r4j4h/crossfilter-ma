/**
 * Calculate the average of a set of numbers
 */
crossfilterMA.calculateRollingAverage = function(setOfNumbers, rollLength) {
    rollLength = (typeof rollLength !== 'undefined' ) ? rollLength : 2;
    var newSet = [];


    return newSet;
};


crossfilterMA.accumulate_group_for_nday_moving_average = function(source_group, ndays) {
    return {
        all:function () {
            var cumulate = 0;
            var result = [];
            var all = source_group.all();
            console.log( 'test', source_group, all );
            var accumulatedAll = all.map(function(d, i, arr) {

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


                var myDx = crossfilter( all );

                var myDimensionDate = myDx.dimension(function(d) {
                    return d.key;
                });


                while ( thisDay++ < days ) {
                    var targetDay =  arr[i - thisDay];
                    if ( targetDay ) {


                        //var momentedDate = moment( d.key );
                        //momentedDate.subtract( thisDay, 'hours' );
                        //myDimensionDate.filterExact( batchYear( momentedDate ) );
                        //var thisDaysTotals = myDimensionDate.top( 1 );
                        //var thisDaysTotals = source_group.top( 1 );
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
                    debug:{
                        'cumulate': cumulate,
                        thisResult: thisResult,
                        'result': result
                    }
                };
            });

            return accumulatedAll;
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
};



crossfilterMA.accumulate_group_for_2day_moving_average = function(source_group) {
    return crossfilterMA.accumulate_group_for_nday_moving_average(source_group, 2);
};
