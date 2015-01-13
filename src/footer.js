

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
