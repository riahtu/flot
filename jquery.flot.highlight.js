/* Flot plugin for selecting regions of a plot.

Copyright (c) 2017 John Donnal.
Licensed under the MIT license.

The plugin supports these options:

highlight: {
    color: color,
}

This plugin highlights a section of the plot.

The plugin adds the following methods to the plot object:

- setSelection( from, to )

- clearSelection( )

*/

(function ($) {
    function init(plot) {
        var highlight = {
            show: false,
            color: '#00FF00',
            from: 0,
            to: 0
        };

        function showHighlight(x) {
            highlight.show = x;
            plot.triggerRedrawOverlay();
            return;
        }

        // function taken from markings support in Flot
        function extractRange(ranges, coord) {
            var axis, from, to, key, axes = plot.getAxes();

            for (var k in axes) {
                axis = axes[k];
                if (axis.direction == coord) {
                    key = coord + axis.n + "axis";
                    if (!ranges[key] && axis.n == 1)
                        key = coord + "axis"; // support x1axis as xaxis
                    if (ranges[key]) {
                        from = ranges[key].from;
                        to = ranges[key].to;
                        break;
                    }
                }
            }

            // backwards-compat stuff - to be removed in future
            if (!ranges[key]) {
                axis = coord == "x" ? plot.getXAxes()[0] : plot.getYAxes()[0];
                from = ranges[coord + "1"];
                to = ranges[coord + "2"];
            }

            // auto-reverse as an added bonus
            if (from != null && to != null && from > to) {
                var tmp = from;
                from = to;
                to = tmp;
            }

            return { from: from, to: to, axis: axis };
        }

        function setHighlight(from, to) {
            highlight.from = from;
            highlight.to = to;

            highlight.show = true;
            plot.triggerRedrawOverlay();
        }

        plot.setHighlight = setHighlight;
        plot.showHighlight = showHighlight;

        //private functions

        function highlightBounds() {
            //compute the selection
            var range, o = plot.getOptions();
            range = extractRange({ xaxis: { from: highlight.from, to: highlight.to } }, "x");

            return {
                first: {
                    x: range.axis.p2c(range.from),
                    y: 0
                },
                second: {
                    x: range.axis.p2c(range.to),
                    y: plot.height()
                }
            }
        }
        function selectionIsSane() {
            var minSize = 5;
            var bounds = highlightBounds();
            return Math.abs(bounds.second.x - bounds.first.x) >= minSize &&
                Math.abs(bounds.second.y - bounds.first.y) >= minSize;
        }

        plot.hooks.drawOverlay.push(function (plot, ctx) {
            var bounds = highlightBounds();
            // draw selection
            if (!highlight.show)
                return;
            var bounds = highlightBounds();
            var x = Math.min(bounds.first.x, bounds.second.x) + 0.5,
                y = Math.min(bounds.first.y, bounds.second.y) + 0.5,
                w = Math.abs(bounds.second.x - bounds.first.x) - 1,
                h = Math.abs(bounds.second.y - bounds.first.y) - 1;
            //make sure we are in bounds
            x = Math.min(x,plot.width());
            if(x<0){
                w += x; //reduce width by x
                x = 0;
            } 
            w = Math.min(w, (plot.width() - x))
            w = Math.max(0, w); //width cannot be negative

            /*x = Math.max(x, 0);
            x = Math.min(x, plot.width())
            w = Math.max(w, 0);
            w = Math.min(w, (plot.width() - x));*/

            var plotOffset = plot.getPlotOffset();
            var o = plot.getOptions();

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);
            var c = $.color.parse(o.highlight.color);
            ctx.strokeStyle = c.scale('a', 0.8).toString();
            if (selectionIsSane()) {
                ctx.lineWidth = 1;
                ctx.lineJoin = "round";
                ctx.fillStyle = c.scale('a', 0.4).toString();
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);
            }
            else {
                ctx.lineWidth = 2;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, plot.height());
                ctx.stroke();
            }

            ctx.restore();
        });



    }

    $.plot.plugins.push({
        init: init,
        options: {
            highlight: {
                color: "#00FF00",
            }
        },
        name: 'highlight',
        version: '0.1'
    });
})(jQuery);
