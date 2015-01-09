crossfilter.ma
=====

crossfilter.ma is a [_crossfilter group_ modifier](https://github.com/dc-js/dc.js/wiki/FAQ#filter-the-data-before-its-charted) to calculate _moving averages_.


How to Install
----

- Ensure requirements are provided on your page
  - crossfilter
  - reductio
- Copy `crossfilter.ma.js` to your scripts directory and provide it on your page
- Use it!


How to Use
----

```
var data = crossfilter([...]);
var dim = data.dimension(...);
var group = dim.group();
var ma;


```
_TODO_


How to Test
----

- Run `grunt test`.
- Run `grunt server` and visit `http://0.0.0.0:8888/spec/`
- Run `grunt coverage` and then `grunt server` and visit `http://0.0.0.0:8888/coverage/


Inspired By
----

- [dc.js](https://github.com/dc-js/dc.js)
  - [Specifically this portion of the FAQ](https://github.com/dc-js/dc.js/wiki/FAQ#filter-the-data-before-its-charted)
- [reductio](https://github.com/esjewett/reductio)
  - An approach towards averages on crossfilter groups
- [crossfilter](https://github.com/square/crossfilter)
- [d3](https://github.com/mbostock/d3)
