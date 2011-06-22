var paint = {
    canvas: null,
    context: null,
    stream: null,
    drawing: false,
    sizes: {
        thin: 2,
        medium: 4,
        thick: 8
    },
    init: function(canvas, stream) {
        paint.canvas = canvas;
        paint.stream = stream;
        paint.context = canvas.get(0).getContext('2d');
        canvas.bind('mousedown touchstart', paint.mousedown);
        canvas.bind('mouseup touchend', paint.mouseup);
        canvas.bind('mousemove touchmove', paint.mousemove);
        canvas.get(0).onselectstart = function() {
            // prevent cursor from changing.
            return false;
        };
        $(window).bind('resize', function(event) {
            canvas.get(0).width = canvas.parent().width();
            canvas.get(0).height = canvas.parent().height();
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

            paint.stream.send(JSON.stringify({
                x: e.clientX,
                y: e.clientY - 40,
                w: paint.sizes[$.trim($('#stroke li.active').text().toLowerCase())],
                c: $.trim($('#color li.active').text())
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

    // open a stream to hydna in read/write mode
    var stream = new HydnaStream('demo.hydna.net/1111', 'rw', null);

    // draw figure when data is received over stream
    stream.onmessage = function(data) {
        var graph = JSON.parse(data);
        paint.draw(graph.x, graph.y, graph.w, graph.c);
    };

    // initiate paint when stream is ready.
    stream.onopen = function() {
        paint.init(canvas, stream);
    };

    stream.onerror = function() {
        // console.log('error');
    };

    stream.onclose = function() {
        // console.log('close');
    }

    $('.picker li').click(function(event) {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
    });
});
