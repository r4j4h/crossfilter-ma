/*!
 *  dc 1.0.0-dev
 *  http://dc-js.github.io/dc.js/
 *  Copyright 2012 Nick Zhu and other contributors
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
 * Version: 1.0.0-dev
 * Author: Jasmine Hegman
 */

var crossfilterMA = {
    version: '1.0.0-dev',
    constants: {
        CHART_CLASS: 'dc-chart',
        DEBUG_GROUP_CLASS: 'debug',
        STACK_CLASS: 'stack',
        DESELECTED_CLASS: 'deselected',
        SELECTED_CLASS: 'selected',
        NODE_INDEX_NAME: '__index__',
        GROUP_INDEX_NAME: '__group_index__',
        DEFAULT_CHART_GROUP: '__default_chart_group__',
        EVENT_DELAY: 40,
        NEGLIGIBLE_NUMBER: 1e-10
    },
    _renderlet: null
};

crossfilterMA[ 'crossfilter-ma' ] = function() {
    return 'hello world';
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
