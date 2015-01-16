/*!
 *  crossfilter-ma 1.2.2
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

(function() { function _crossfilterMA(crossfilter) {
    'use strict';

/**
 * crossfilter.ma is a crossfilter group modifier (in reductio-like fashion) to calculate moving averages.
 *
 * Version: 1.2.2
 * Author: Jasmine Hegman
 */

var crossfilterMA = {};

crossfilterMA.version = '1.2.2';

crossfilterMA.constants = {
    DEFAULT_MOVING_AVERAGE_NODES: 2
};

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

                var thisDay = d;
                var perc = 0;

                var thisDayIndex = orderedDates.indexOf( _this.keyAccessor()( d ) );
                var prevDayId = orderedDates[ thisDayIndex - 1 ];
                var prevDayValue;

                if ( prevDayId ) {
                    var prevDayBlock = fullDates[ prevDayId ];
                    prevDayValue = prevDayBlock.myValue;

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

                var thisDay = d;
                var perc = 0;

                var thisDayIndex = orderedDates.indexOf( _this.keyAccessor()( d ) );
                var prevDayId = orderedDates[ thisDayIndex - 1 ];
                var prevDayValue;

                if ( prevDayId ) {
                    var prevDayBlock = fullDates[ prevDayId ];
                    prevDayValue = prevDayBlock.myValue;

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



        // Expose crossfilter, so that clients in browserify
        // case can obtain it if they need it.
        crossfilterMA.crossfilter = crossfilter;

        return crossfilterMA;}
        if(typeof define === "function" && define.amd) {
            define(["crossfilter"], _crossfilterMA);
        } else if(typeof module === "object" && module.exports) {
            var _crossfilter = require('crossfilter');
            // When using npm + browserify, 'crossfilter' is a function,
            // since package.json specifies index.js as main function, and it
            // does special handling. When using bower + browserify,
            // there's no main in bower.json (in fact, there's no bower.json),
            // so we need to fix it.
            if (typeof _crossfilter !== "function") {
                _crossfilter = _crossfilter.crossfilter;
            }
            module.exports = _crossfilterMA(_crossfilter);
        } else {
            this['crossfilter-ma'] = _crossfilterMA(crossfilter);
            this.crossfilter$ma = this['crossfilter-ma'];
        }
    }
)();
