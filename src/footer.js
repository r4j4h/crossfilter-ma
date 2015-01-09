

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
