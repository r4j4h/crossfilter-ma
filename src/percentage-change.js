
var crossfilterMA = crossfilterMA || {};


/**
 * Order a set of datums that contain percentageChange values by percentageChange
 *
 * @param {Boolean|Number} orderingByPercentageChange If 1, orders ascending. If -1, orders descending. Else, noop.
 * @param {Array<{percentageChange: Number}>} results Set of datums
 */
function _potentiallyOrderByPercentageChange( orderingByPercentageChange, results ) {

    if ( orderingByPercentageChange === 1 ) {
        results.sort( function ( a, b ) {
            if ( a.percentageChange > b.percentageChange ) {
                return 1;
            }
            if ( a.percentageChange < b.percentageChange ) {
                return -1;
            }
            // a must be equal to b
            return 0;
        } );
    } else if ( orderingByPercentageChange === -1 ) {
        results.sort( function ( a, b ) {
            if ( a.percentageChange > b.percentageChange ) {
                return -1;
            }
            if ( a.percentageChange < b.percentageChange ) {
                return 1;
            }
            // a must be equal to b
            return 0;
        } );
    }

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

    var _keyAccessor;
    var _valueAccessor;

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


        all: function () {
            var _this = this;
            var all = sourceGroup.all();

            // Gather all values so we can compare against previous ones
            var fullDates = {};
            all.forEach(
                function( d ) {
                    fullDates[ _this.keyAccessor()( d ) ] = _this.valueAccessor()( d );
                }
            );
            var orderedDates = Object.keys( fullDates ).sort();

            var accumulatedAll = all.map( function( d, i, arr ) {

                var thisDay = d;
                var perc = 0;

                var thisDayIndex = orderedDates.indexOf( _this.keyAccessor()( d ) );
                var prevDayId = orderedDates[ thisDayIndex - 1 ];
                var prevDayValue;

                if ( prevDayId ) {
                    var prevDayBlock = fullDates[ prevDayId ];
                    prevDayValue = prevDayBlock;

                    var diff = _this.valueAccessor()( thisDay ) - prevDayValue;

                    if ( diff !== 0 ) {
                        var prop = diff / prevDayValue;
                        perc = prop * 100;
                    } else {
                        perc = 0;
                    }
                }

                var returnObj = {
                    key: d.key,
                    value: d.value,
                    percentageChange: perc
                };

                if ( debugMode ) {
                    returnObj._debug = {
                        'thisDayKey': thisDay.key,
                        'thisDayValue': thisDay.value,
                        'prevDayKey': prevDayId ? prevDayId : 'None',
                        'prevDayValue': prevDayValue ? prevDayValue : 'None'
                    };
                }

                return returnObj;
            } );

            _potentiallyOrderByPercentageChange( orderingByPercentageChange, accumulatedAll );

            return accumulatedAll;
        },

        top: function() {

            var _this = this;
            var all = sourceGroup.top.apply( sourceGroup, arguments );

            // Gather all values so we can compare against previous ones
            var fullDates = {};
            all.forEach(
                function( d ) {
                    fullDates[ _this.keyAccessor()( d ) ] = _this.valueAccessor()( d );
                }
            );
            var orderedDates = Object.keys( fullDates ).sort();

            var accumulatedAll = all.map( function( d, i, arr ) {

                var thisDay = d;
                var perc = 0;

                var thisDayIndex = orderedDates.indexOf( _this.keyAccessor()( d ) );
                var prevDayId = orderedDates[ thisDayIndex - 1 ];
                var prevDayValue;

                if ( prevDayId ) {
                    var prevDayBlock = fullDates[ prevDayId ];
                    prevDayValue = prevDayBlock;

                    var diff = _this.valueAccessor()( thisDay ) - prevDayValue;

                    if ( diff !== 0 ) {
                        var prop = diff / prevDayValue;
                        perc = prop * 100;
                    } else {
                        perc = 0;
                    }
                }

                var returnObj = {
                    key: d.key,
                    value: d.value,
                    percentageChange: perc
                };

                if ( debugMode ) {
                    returnObj._debug = {
                        'thisDayKey': thisDay.key,
                        'thisDayValue': thisDay.value,
                        'prevDayKey': prevDayId ? prevDayId : 'None',
                        'prevDayValue': prevDayId ? prevDayValue : 'None'
                    };
                }

                return returnObj;
            } );

            _potentiallyOrderByPercentageChange( orderingByPercentageChange, accumulatedAll );

            return accumulatedAll;

        }
    };
};
