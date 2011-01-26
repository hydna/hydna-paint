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
        paint.context = canvas.getContext('2d');
        canvas.onmousedown = paint.mousedown;
        canvas.onmouseup = paint.mouseup;
        canvas.onmousemove = paint.mousemove;
        canvas.onselectstart = function() {
            // prevent cursor from changing.
            return false;
        };
        window.onresize =  function() {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        };
        window.onresize();
    },
    mousedown: function(event) {
        paint.drawing = true;
    },
    mouseup: function(event) {
        paint.drawing = false;
    },
    mousemove: function(event) {
        if (paint.drawing) {
            paint.stream.send(JSON.stringify({
                x: event.offsetX,
                y: event.offsetY,
                w: paint.sizes[$('#stroke li.active').text().toLowerCase()],
                c: $('#color li.active').text()
            }));
        }
    },
    draw: function(x, y, width, color) {
        paint.context.fillStyle = color;  
        paint.context.beginPath();
        paint.context.arc(x, y, width, 0, Math.PI * 2, true); 
        paint.context.fill();
    }
};

$(document).ready(function() {
    var canvas = document.querySelector('canvas');

    // open a stream to hydna in read/write mode
    var stream = new HydnaStream('demo.hydna.net/1111', 'rw', null, {
        transport: 'ws',
    });

    // draw figure when data is received over stream
    stream.onmessage = function(data) {
        var graph = JSON.parse(data);
        paint.draw(graph.x, graph.y, graph.w, graph.c);
    };

    // initiate paint when stream is ready.
    stream.onopen = function() {
        paint.init(canvas, stream);
    };

    $('.picker li').click(function(event) {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
    });
});
