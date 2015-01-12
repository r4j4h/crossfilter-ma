/*!
 *  crossfilter-ma 1.1.0-dev
 *  https://github.com/r4j4h/crossfilter-ma
 *  Copyright 2015 Jasmine Hegman
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

(function() { function _crossfilterMA(d3, crossfilter) {
    'use strict';

/**
 * crossfilter.ma is a crossfilter group modifier (in reductio-like fashion) to calculate moving averages.
 *
 * Version: 1.1.0-dev
 * Author: Jasmine Hegman
 */

var crossfilterMA = {};

crossfilterMA.version = '1.1.0-dev';

crossfilterMA.constants = {
    DEFAULT_MOVING_AVERAGE_NODES: 2
};

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
                    if ( diff !== 0 ) {
                        var prop = diff / valueAccessor( prevDay );
                        perc = prop * 100;
                    } else {
                        perc = 0;
                    }
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

                    if ( diff !== 0 ) {
                        var prop = diff / prevDayValue;
                        perc = prop * 100;
                    } else {
                        perc = 0;
                    }
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



        // Expose d3 and crossfilter, so that clients in browserify
        // case can obtain them if they need them.
        crossfilterMA.d3 = d3;
        crossfilterMA.crossfilter = crossfilter;

        return crossfilterMA;}
        if(typeof define === "function" && define.amd) {
            define(["d3", "crossfilter"], _crossfilterMA);
        } else if(typeof module === "object" && module.exports) {
            var _d3 = require('d3');
            var _crossfilter = require('crossfilter');
            // When using npm + browserify, 'crossfilter' is a function,
            // since package.json specifies index.js as main function, and it
            // does special handling. When using bower + browserify,
            // there's no main in bower.json (in fact, there's no bower.json),
            // so we need to fix it.
            if (typeof _crossfilter !== "function") {
                _crossfilter = _crossfilter.crossfilter;
            }
            module.exports = _crossfilterMA(_d3, _crossfilter);
        } else {
            this['crossfilter-ma'] = _crossfilterMA(d3, crossfilter);
        }
    }
)();
