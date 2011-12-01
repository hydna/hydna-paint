var paint = {
    canvas: null,
    context: null,
    channel: null,
    drawing: false,
    sizes: {
        thin: 2,
        medium: 4,
        thick: 8
    },
    init: function(canvas, channel) {
        paint.canvas = canvas;
        paint.channel = channel;
        paint.context = canvas.get(0).getContext('2d');
        canvas.bind('mousedown touchstart', paint.mousedown);
        canvas.bind('mouseup touchend', paint.mouseup);
        canvas.bind('mousemove touchmove', paint.mousemove);
        canvas.get(0).onselectstart = function() {
            // prevent cursor from changing.
            return false;
        };
        $(window).bind('resize', function(event) {
            canvas.get(0).width = canvas.width();
            canvas.get(0).height = canvas.height();
        });
        $(window).resize();
    },
    mousedown: function(event) {
        paint.drawing = true;
        return false;
    },
    mouseup: function(event) {
        paint.drawing = false;
        return false;
    },
    mousemove: function(event) {
        var e = (
            window.event && window.event.targetTouches
            ?window.event.targetTouches[0]
            :event
        );
        if (paint.drawing) {
            var position = paint.canvas.parent().position();
            paint.channel.send(JSON.stringify({
                x: e.pageX - position.left,
                y: e.pageY - position.top,
                w: paint.sizes[$('#stroke li.active').text().toLowerCase()],
                c: $('#color li.active').text()
            }));
        }
        return false;
    },
    draw: function(x, y, width, color) {
        paint.context.fillStyle = color;
        paint.context.beginPath();
        paint.context.arc(x, y, width, 0, Math.PI * 2, true);
        paint.context.fill();
    }
};

$(document).ready(function() {
    var canvas = $('canvas');

    // open a channel to hydna in read/write mode
    var channel = new HydnaChannel('public.hydna.net/1111', 'rw');

    // draw figure when data is received over channel
    channel.onmessage = function(data) {
        var graph = JSON.parse(data);
        paint.draw(graph.x, graph.y, graph.w, graph.c);
    };

    // initiate paint when channel is ready.
    channel.onopen = function() {
        paint.init(canvas, channel);
    };

    $('.picker li').click(function(event) {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
    });
});
