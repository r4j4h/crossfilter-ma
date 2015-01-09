/**
 * crossfilter.ma is a crossfilter group modifier (in reductio-like fashion) to calculate moving averages.
 *
 * Version: %VERSION%
 * Author: Jasmine Hegman
 */

var crossfilterMA = {
    version: '%VERSION%',
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
