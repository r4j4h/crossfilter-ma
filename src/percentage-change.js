
var crossfilterMA = crossfilterMA || {};

/**
 * Takes an array of objects, keyAccessor and valueAccessor callbacks, and enumerates the array, storing values by keys
 * and then sorting by keys and returning both the hash and the sorted array.
 *
 * @param {[{}]} datums Array of datums
 * @param {Function} keyAccessor crossfilter/d3 style iterative key function.
 * @param {Function} valueAccessor crossfilter/d3 style iterative value function.
 * @returns {{datesHash: {}, orderedDates: T[]}}
 * @private
 */
function _prepareComparisonValueHashMap( datums, keyAccessor, valueAccessor ) {
    // Gather all values so we can compare against previous ones
    var fullDates = {};
    datums.forEach(
        function( thisDay ) {
            // We do not want to store calculated value here, just the raw value - we can calculate later if we need it!
            fullDates[ keyAccessor( thisDay ) ] = valueAccessor( thisDay );
        }
    );
    var orderedDates = Object.keys( fullDates ).sort();
    return {
        datesHash: fullDates,
        orderedDates: orderedDates
    };
}

/**
 * Calculate percent change.
 *
 * Note that if the first number is 0, % change is impossible to calculate and will return NaN
 *
 * @param {Number} oldValue
 * @param {Number} newValue
 * @returns {number}
 * @private
 */
function _calculatePercentageChange( oldValue, newValue ) {

    var perc, diff;

    if ( typeof oldValue === 'undefined' || typeof newValue === 'undefined' || oldValue === 0 ) {
        return NaN;
    }

    perc = 0;
    diff = newValue - oldValue;

    if ( diff !== 0 ) {
        var prop = diff / oldValue;
        perc = prop * 100;
    } else {
        perc = 0;
    }

    return perc;
}

/**
 * Order a set of datums that contain percentageChange values by percentageChange
 *
 * @param {Boolean|Number} orderingByPercentageChange If 1, orders ascending. If -1, orders descending. Else, noop.
 * @param {Array<{percentageChange: Number}>} results Set of datums
 * @returns {*}
 * @private
 */
function _potentiallyOrderByPercentageChange( orderingByPercentageChange, results ) {

    if ( orderingByPercentageChange === 1 ) {
        results.sort( function ( a, b ) {
            if ( isNaN( a.percentageChange ) ) { return -1; }
            if ( isNaN( b.percentageChange ) ) { return 1; }
            if ( a.percentageChange > b.percentageChange ) { return 1; }
            if ( a.percentageChange < b.percentageChange ) { return -1; }
            // a must be equal to b
            return 0;
        } );
    } else if ( orderingByPercentageChange === -1 ) {
        results.sort( function ( a, b ) {
            if ( isNaN( a.percentageChange ) ) { return 1; }
            if ( isNaN( b.percentageChange ) ) { return -1; }
            if ( a.percentageChange > b.percentageChange ) { return -1; }
            if ( a.percentageChange < b.percentageChange ) { return 1; }
            // a must be equal to b
            return 0;
        } );
    }

    return results;

}

/**
 * Convert an hash map (object containing objects) into an array containing objects for sorting
 * @param {[{}]} keyedSet
 * @returns {U[]}
 * @private
 */
function _convertKeyedSetToArray( keyedSet ) {
    return Object.keys( keyedSet ).map( function( d ) { return keyedSet[ d ]; } );
}

/**
 * Order a keyed set of datums that contain percentageChange values by percentageChange
 *
 * @param {Boolean|Number} orderingByPercentageChange If 1, orders ascending. If -1, orders descending. Else, noop.
 * @param {Array<{percentageChange: Number}>} results Set of datums
 * @returns {Boolean|[]}
 * @private
 */
function _potentiallyOrderIterationAccessorResultsByPercentageChange( orderingByPercentageChange, results ) {

    if ( orderingByPercentageChange === 1 ) {
        results = _convertKeyedSetToArray( results );
        return _potentiallyOrderByPercentageChange( orderingByPercentageChange, results );
    } else if ( orderingByPercentageChange === -1 ) {
        results = _convertKeyedSetToArray( results );
        return _potentiallyOrderByPercentageChange( orderingByPercentageChange, results );
    }

    return false;
}

/**
 * Calculate the percentage change for a set of numbers
 *
 * @param {{all: Function, top: Function}} sourceGroup Crossfilter group.
 * crossfilterMA.constants.DEFAULT_MOVING_AVERAGE_NODES if not provided.
 * @param {Boolean} [debugMode] Includes a debugging object under the `_debug` key in the result objects, defaults to
 * false.
 * @returns {{all: Function, top: Function}}
 */
crossfilterMA.accumulateGroupForPercentageChange = function( sourceGroup, debugMode ) {
    if ( !sourceGroup || !sourceGroup.all || typeof sourceGroup.all !== 'function' ) {
        throw new Error( 'You must pass in a crossfilter group!' );
    }

    // Handle defaults
    debugMode = ( typeof debugMode !== 'undefined' ) ? !!debugMode : false;
    var orderingByPercentageChange = false;
    var orderingOnlyNestedValuesByPercentageChange = false;

    var _keyAccessor;
    var _valueAccessor;
    var _calculationAccessor;
    var _iterationAccessor;

    return {

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
        _defaultCalculationAccessor: function() {
            return function( d ) {
                return d;
            };
        },
        _defaultIterationAccessor: function() {
            return '';
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

        calculationAccessor: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                if ( typeof _calculationAccessor === 'undefined' ) {
                    _calculationAccessor = this._defaultCalculationAccessor();
                }
                return _calculationAccessor;
            }
            _calculationAccessor = _;
        },

        iterationAccessor: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                if ( typeof _iterationAccessor === 'undefined' ) {
                    _iterationAccessor = this._defaultIterationAccessor();
                }
                return _iterationAccessor;
            }
            _iterationAccessor = _;
        },

        /**
         * Enables/disables/configures ordering by percent change.
         *
         * @param {Boolean|Number} [_]
         * If not provided, retur
         */
        orderByPercentageChange: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                return orderingByPercentageChange;
            }
            switch ( _ ) {
                case 1:
                    orderingByPercentageChange = 1;
                    break;
                case -1:
                    orderingByPercentageChange = -1;
                    break;
                default:
                case 0:
                    orderingByPercentageChange = false;
                    break;

            }
        },

        /**
         * Enables/disabling ordering of outer group flag, allowing only nested data to be sorted
         * Or returns the current status of the flag if no parameters are provided.
         * @param {boolean} [_]
         */
        orderOnlyNestedValuesByPercentageChange: function( _ ) {
            if ( typeof _ === 'undefined' ) {
                return orderingOnlyNestedValuesByPercentageChange;
            }
            switch ( _ ) {
                case true:
                case false:
                    orderingOnlyNestedValuesByPercentageChange = _;
                    break;
                default:
                case 0:
                    break;
            }
        },


        all: function () {

            var _this = this;
            var all = sourceGroup.all();

            var hmm = _prepareComparisonValueHashMap( all, _this.keyAccessor(), _this.valueAccessor() );
            var fullDates = hmm.datesHash;
            var orderedDates = hmm.orderedDates;

            var accumulatedAll = all.map( function( thisDay, i, arr ) {

                var returnObj = {};

                var perc = 0;

                var iterationAccessor = _this.iterationAccessor();

                var thisDayIndex = orderedDates.indexOf( _this.keyAccessor()( thisDay ) );
                var thisDayId = orderedDates[ thisDayIndex ];
                var thisDayValue = fullDates[ thisDayId ];
                var thisDayCalculatedValue = _this.calculationAccessor()( thisDayValue );
                var thisDayIterator = thisDayValue ? thisDayValue[ iterationAccessor ] : undefined;

                var prevDayIndex = thisDayIndex - 1;
                var prevDayId = orderedDates[ prevDayIndex ];
                var prevDayValue = (
                    typeof prevDayId !== 'undefined' ?
                        fullDates[ prevDayId ] :
                        undefined
                );
                var prevDayCalculatedValue = (
                    typeof prevDayValue !== 'undefined' ?
                        _this.calculationAccessor()( prevDayValue ) :
                        undefined
                );
                var prevDayIterator = prevDayValue ? prevDayValue[ iterationAccessor ] : undefined;


                if ( ( thisDayIterator || prevDayIterator ) ) {

                    Object.keys( ( thisDayIterator || prevDayIterator ) ).forEach( function( i ) {

                        var curVal = thisDayIterator && thisDayIterator[ i ] ?
                            _this.calculationAccessor()( thisDayIterator[ i ] ) :
                            undefined;
                        var prevVal = prevDayIterator && prevDayIterator[ i ] ?
                            _this.calculationAccessor()( prevDayIterator[ i ] ) :
                            undefined;

                        perc = _calculatePercentageChange( prevVal, curVal );

                        returnObj[ iterationAccessor ] = returnObj[ iterationAccessor ] || {};
                        returnObj[ iterationAccessor ][ i ] = returnObj[ iterationAccessor ][ i ] || {};

                        if ( debugMode ) {
                            returnObj[ iterationAccessor ][ i ]._debug = {
                                key: i,
                                value: curVal,
                                prevKey: prevVal ? i : 'None',
                                prevValue: prevVal ? prevVal : 'None'
                            };

                            // Probably don't want to store here after all... todo ruminate on this
                            returnObj._debug = returnObj._debug || {};
                            returnObj._debug[ iterationAccessor ] = returnObj._debug[ iterationAccessor ] || {};
                            returnObj._debug[ iterationAccessor ][ i ] = {
                                key: i,
                                value: curVal,
                                prevKey: prevVal ? i : 'None',
                                prevValue: prevVal ? prevVal : 'None'
                            };
                        }

                        returnObj[ iterationAccessor ][ i ].key = i;
                        returnObj[ iterationAccessor ][ i ].value = curVal;
                        returnObj[ iterationAccessor ][ i ].percentageChange = perc;

                    } );

                    var sorted = _potentiallyOrderIterationAccessorResultsByPercentageChange(
                        orderingByPercentageChange,
                        returnObj[ iterationAccessor ]
                    );
                    if ( sorted ) {
                        returnObj[ iterationAccessor ] = sorted;
                    }
                }


                perc = _calculatePercentageChange( prevDayCalculatedValue, thisDayCalculatedValue );

                returnObj.key = thisDayId;
                returnObj.value = thisDayCalculatedValue;
                returnObj.percentageChange = perc;

                if ( debugMode ) {
                    returnObj._debug = {
                        'thisDayKey': thisDayId,
                        'thisDayValue': thisDayValue,
                        'thisDayCalculatedValue': thisDayCalculatedValue,
                        'prevDayKey': prevDayId ? prevDayId : 'None',
                        'prevDayValue': prevDayValue ? prevDayValue : 'None',
                        'prevDayCalculatedValue': prevDayCalculatedValue
                    };
                }

                return returnObj;
            } );

            if ( !orderingOnlyNestedValuesByPercentageChange ) {
                _potentiallyOrderByPercentageChange( orderingByPercentageChange, accumulatedAll );
            }

            return accumulatedAll;
        },


        top: function() {

            var _this = this;
            var all = sourceGroup.top.apply( sourceGroup, arguments );

            var hmm = _prepareComparisonValueHashMap( all, _this.keyAccessor(), _this.valueAccessor() );
            var fullDates = hmm.datesHash;
            var orderedDates = hmm.orderedDates;

            var accumulatedAll = all.map( function( thisDay, i, arr ) {

                var returnObj = {};

                var perc = 0;

                var iterationAccessor = _this.iterationAccessor();

                var thisDayIndex = orderedDates.indexOf( _this.keyAccessor()( thisDay ) );
                var thisDayId = orderedDates[ thisDayIndex ];
                var thisDayValue = fullDates[ thisDayId ];
                var thisDayCalculatedValue = _this.calculationAccessor()( thisDayValue );
                var thisDayIterator = thisDayValue ? thisDayValue[ iterationAccessor ] : undefined;

                var prevDayIndex = thisDayIndex - 1;
                var prevDayId = orderedDates[ prevDayIndex ];
                var prevDayValue = ( typeof prevDayId !== 'undefined' ? fullDates[ prevDayId ] : undefined );
                var prevDayCalculatedValue = (
                    typeof prevDayValue !== 'undefined' ?
                        _this.calculationAccessor()( prevDayValue ) :
                        undefined
                );
                var prevDayIterator = prevDayValue ? prevDayValue[ iterationAccessor ] : undefined;


                if ( ( thisDayIterator || prevDayIterator ) ) {

                    Object.keys( ( thisDayIterator || prevDayIterator ) ).forEach( function( i ) {

                        var curVal = thisDayIterator && thisDayIterator[ i ] ?
                                _this.calculationAccessor()( thisDayIterator[ i ] ) :
                                undefined;
                        var prevVal = prevDayIterator && prevDayIterator[ i ] ?
                                _this.calculationAccessor()( prevDayIterator[ i ] ) :
                                undefined;

                        perc = _calculatePercentageChange( prevVal, curVal );

                        returnObj[ iterationAccessor ] = returnObj[ iterationAccessor ] || {};
                        returnObj[ iterationAccessor ][ i ] = returnObj[ iterationAccessor ][ i ] || {};

                        if ( debugMode ) {
                            returnObj[ iterationAccessor ][ i ]._debug = {
                                key: i,
                                value: curVal,
                                prevKey: prevVal ? i : 'None',
                                prevValue: prevVal ? prevVal : 'None'
                            };

                            // Probably don't want to store here after all... todo ruminate on this
                            returnObj._debug = returnObj._debug || {};
                            returnObj._debug[ iterationAccessor ] = returnObj._debug[ iterationAccessor ] || {};
                            returnObj._debug[ iterationAccessor ][ i ] = {
                                key: i,
                                value: curVal,
                                prevKey: prevVal ? i : 'None',
                                prevValue: prevVal ? prevVal : 'None'
                            };
                        }

                        returnObj[ iterationAccessor ][ i ].key = i;
                        returnObj[ iterationAccessor ][ i ].value = curVal;
                        returnObj[ iterationAccessor ][ i ].percentageChange = perc;

                    } );

                    var sorted = _potentiallyOrderIterationAccessorResultsByPercentageChange(
                        orderingByPercentageChange,
                        returnObj[ iterationAccessor ]
                    );
                    if ( sorted ) {
                        returnObj[ iterationAccessor ] = sorted;
                    }
                }


                perc = _calculatePercentageChange( prevDayCalculatedValue, thisDayCalculatedValue );

                returnObj.key = thisDayId;
                returnObj.value = thisDayCalculatedValue;
                returnObj.percentageChange = perc;

                if ( debugMode ) {
                    returnObj._debug = returnObj._debug || {};
                    returnObj._debug.thisDayKey =   thisDayId;
                    returnObj._debug.thisDayValue = thisDayCalculatedValue;
                    returnObj._debug.prevDayKey =   prevDayId ? prevDayId : 'None';
                    returnObj._debug.prevDayValue = prevDayId ? prevDayCalculatedValue : 'None';
                }


                return returnObj;
            } );

            if ( !orderingOnlyNestedValuesByPercentageChange ) {
                _potentiallyOrderByPercentageChange( orderingByPercentageChange, accumulatedAll );
            }

            return accumulatedAll;

        }
    };
};
