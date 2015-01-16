var crossfilterMA = crossfilterMA || {};


/**
 * Order a set of datums that contain rollingAverage values by rollingAverage
 *
 * @param {Boolean|Number} orderingByRollingAverage If 1, orders ascending. If -1, orders descending. Else, noop.
 * @param {Array<{rollingAverage: Number}>} results Set of datums
 */
function _potentiallyOrderByRollingAverage( orderingByRollingAverage, results ) {

    if ( orderingByRollingAverage === 1 ) {
        results.sort( function ( a, b ) {
            if ( a.rollingAverage > b.rollingAverage ) {
                return 1;
            }
            if ( a.rollingAverage < b.rollingAverage ) {
                return -1;
            }
            // a must be equal to b
            return 0;
        } );
    } else if ( orderingByRollingAverage === -1 ) {
        results.sort( function ( a, b ) {
            if ( a.rollingAverage > b.rollingAverage ) {
                return -1;
            }
            if ( a.rollingAverage < b.rollingAverage ) {
                return 1;
            }
            // a must be equal to b
            return 0;
        } );
    }

}



/**
 * Calculate the average of a set of numbers
 *
 * @param {{all: Function, top: Function}} sourceGroup Crossfilter group.
 * @param {Number} [ndays] Number of datapoints for moving average. Defaults to the current value of
 * crossfilterMA.constants.DEFAULT_MOVING_AVERAGE_NODES if not provided.
 * @param {Boolean} [rolldownMode] Rolls the average smaller when the request duration is not available.
 * @param {Boolean} [debugMode] Includes a debugging object under the `_debug` key in the result objects, defaults to
 * false.
 * @returns {{all: Function, top: Function}}
 */
crossfilterMA.accumulateGroupForNDayMovingAverage = function( sourceGroup, ndays, rolldownMode, debugMode ) {
    if ( !sourceGroup || !sourceGroup.all || typeof sourceGroup.all !== 'function' ) {
        throw new Error( 'You must pass in a crossfilter group!' );
    }

    // Handle defaults
    ndays = ( typeof ndays !== 'undefined' ) ? ndays : crossfilterMA.constants.DEFAULT_MOVING_AVERAGE_NODES;
    debugMode = ( typeof debugMode !== 'undefined' ) ? !!debugMode : false;
    rolldownMode = ( typeof rolldownMode !== 'undefined' ) ? !!rolldownMode : false;

    var orderingByRollingAverage = false;

    var _keyAccessor;
    var _valueAccessor;

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

        /**
         * Set or get the state of the rolldown flag, used to gain a moving average albeit of lesser length than
         * requested.
         *
         * @param {Number} [_]
         * @returns {Number}
         */
        rolldown: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                return rolldownMode;
            }
            rolldownMode = !!_;
        },

        /**
         * Set or get the state of the debugging flag, used to include a debugging object under the `_debug` key in
         * the result objects, defaults to false.
         *
         * @param {Number} [_]
         * @returns {Number}
         */
        _debug: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                return debugMode;
            }
            debugMode = !!_;
        },

        _defaultKeyAccessor: function() {
            return function( d ) {
                return d.key;
            };
        },
        _defaultValueAccessor: function() {
            return function( d ) {
                return d.value;
            };
        },


        keyAccessor: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                if ( typeof _keyAccessor === 'undefined' ) {
                    _keyAccessor = this._defaultKeyAccessor();
                }
                return _keyAccessor;
            }
            _keyAccessor = _;
        },

        valueAccessor: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                if ( typeof _valueAccessor === 'undefined' ) {
                    _valueAccessor = this._defaultValueAccessor();
                }
                return _valueAccessor;
            }
            _valueAccessor = _;
        },


        /**
         * Enables/disables/configures ordering by rolling average.
         *
         * @param {Boolean|Number} [_]
         * If not provided, retur
         */
        orderByMovingAverage: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                return orderingByRollingAverage;
            }
            switch ( _ ) {
                case 1:
                    orderingByRollingAverage = 1;
                    break;
                case -1:
                    orderingByRollingAverage = -1;
                    break;
                default:
                case 0:
                    orderingByRollingAverage = false;
                    break;

            }
        },


        all: function () {
            var _this = this;
            var cumulate = 0;
            var all = sourceGroup.all();
            var fullDates = {};

            var myDx = crossfilter( all );
            var myDimensionDate = myDx.dimension( function( d ) {
                return d.key;
            } );
            var myGroupingOnDate = myDimensionDate.group();

            var reducer = myGroupingOnDate.reduce(
                function ( p, v ) {
                    var selDate = _this.keyAccessor()( v );
                    var selValue = _this.valueAccessor()( v );

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
                    var selDate = _this.keyAccessor()( v );
                    var selValue = _this.valueAccessor()( v );

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
            var orderedDates = Object.keys( fullDates ).sort();

            var accumulatedAll = all.map( function( d, i, arr ) {

                var thisDayKey = _this.keyAccessor()( d );
                var thisDayValue = _this.valueAccessor()( d );
                var thisDayIndex = orderedDates.indexOf( thisDayKey );


                var days = ndays;

                var numsToAverage = 0;
                var thisCumulate = 0;
                var thisAverage = 0;

                var datumsUsed = [];

                // find previous n-1 days
                while ( --days > 0 ) {
                    //var targetDay =  arr[i - days];
                    var targetDayId = orderedDates[ thisDayIndex - days ];

                    if ( !targetDayId && !rolldownMode ) {
                        break;
                    }

                    if ( targetDayId ) {
                        var targetDayBlock = fullDates[ targetDayId ];
                        var targetDayValue = targetDayBlock.myValue;

                        numsToAverage++;
                        thisCumulate += targetDayValue;
                        if ( debugMode ) {
                            datumsUsed.push( { 'key': targetDayId, 'value': targetDayValue } );
                        }

                    }
                }

                numsToAverage++;
                thisCumulate += thisDayValue;

                if ( debugMode ) {
                    cumulate += thisDayValue;
                    datumsUsed.push( { 'key': thisDayKey, 'value': thisDayValue } );
                }

                thisAverage = thisCumulate / numsToAverage;

                if ( numsToAverage < ndays && !rolldownMode ) {
                    thisAverage = 0;
                }

                var returnObj = {
                    key           : thisDayKey,
                    value         : thisDayValue,
                    rollingAverage: thisAverage
                };

                if ( debugMode ) {
                    returnObj._debug = {
                        'cumulate': cumulate,
                        datumsUsed: datumsUsed
                    };
                }

                return returnObj;
            } );

            _potentiallyOrderByRollingAverage( orderingByRollingAverage, accumulatedAll );

            return accumulatedAll;
        },

        top: function() {
            var _this = this;
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
                    var selDate = _this.keyAccessor()( v );
                    var selValue = _this.valueAccessor()( v );

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
                    var selDate = _this.keyAccessor()( v );
                    var selValue = _this.valueAccessor()( v );

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
            var orderedDates = Object.keys( fullDates ).sort();

            var accumulatedAll = all.map( function( d, i, arr ) {

                var thisDayKey = _this.keyAccessor()( d );
                var thisDayValue = _this.valueAccessor()( d );
                var thisDayIndex = orderedDates.indexOf( thisDayKey );

                var days = ndays;

                var numsToAverage = 0;
                var thisCumulate = 0;
                var thisAverage = 0;

                var datumsUsed = [];

                // find previous n-1 days
                while ( --days > 0 ) {
                    //var targetDay =  arr[i - thisDay];
                    var targetDayId = orderedDates[ thisDayIndex - days ];

                    if ( !targetDayId && !rolldownMode ) {
                        break;
                    }

                    if ( targetDayId ) {
                        var targetDayBlock = fullDates[ targetDayId ];
                        var targetDayValue = targetDayBlock.myValue;

                        numsToAverage++;
                        thisCumulate += targetDayValue;

                        if ( debugMode ) {
                            datumsUsed.push( { 'key': targetDayId, 'value': targetDayValue } );
                        }
                    }
                }

                numsToAverage++;
                thisCumulate += thisDayValue;

                if ( debugMode ) {
                    cumulate += thisDayValue;
                    datumsUsed.push( { 'key': thisDayKey, 'value': thisDayValue } );
                }

                thisAverage = thisCumulate / numsToAverage;

                if ( numsToAverage < ndays && !rolldownMode ) {
                    thisAverage = 0;
                }

                var returnObj = {
                    key: thisDayKey,
                    value: thisDayValue,
                    rollingAverage: thisAverage
                };

                if ( debugMode ) {
                    returnObj._debug = {
                        'cumulate': cumulate,
                        datumsUsed: datumsUsed
                    };
                }

                return returnObj;
            } );

            _potentiallyOrderByRollingAverage( orderingByRollingAverage, accumulatedAll );

            return accumulatedAll;
        }
    };
};
