var paint = {
    id: 0,
    canvas: null,
    context: null,
    channel: null,
    drawing: false,
    s_color: '#e53a3c',
    s_size: 2,
    prev_x: 0,
    prev_y: 0,
    sizes: {
        thin: 2,
        medium: 4,
        thick: 8
    },
    init: function(canvas, channel) {
        paint.id = paint.uid();
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
            canvas.get(0).width = canvas.parent().width();
            canvas.get(0).height = canvas.parent().height();
        });
        $(window).resize();
    },
    mousedown: function(event) {
        paint.drawing = true;
        paint.prev_x = event.clientX;
        paint.prev_y = event.clientY - 40;
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
<<<<<<< HEAD
            
            var new_x = e.clientX;
            var new_y = e.clientY - 40;
            
            var graph = {
                x: new_x,
                y: new_y,
                px: paint.prev_x,
                py: paint.prev_y,
                w: paint.s_size,
                c: paint.s_color,
                id: paint.id
            };
            
            paint.draw(graph.px, graph.py, graph.x, graph.y, graph.w, graph.c);
            
            paint.channel.send(JSON.stringify(graph));
            
            paint.prev_x = new_x;
            paint.prev_y = new_y;
=======

            paint.stream.send(JSON.stringify({
                x: e.clientX,
                y: e.clientY - 40,
                w: paint.sizes[$.trim($('#stroke li.active').text().toLowerCase())],
                c: $.trim($('#color li.active').text())
            }));
>>>>>>> fixes to run on ie7.
        }
        return false;
    },
    draw: function(px, py, x, y, width, color) {
        
        paint.context.strokeStyle = color;
        paint.context.beginPath();
        
        paint.context.moveTo(px, py);
        paint.context.lineTo(x, y);
        
        paint.context.lineWidth = width;
        paint.context.lineCap = 'round';
        paint.context.strokeStyle = color;
        paint.context.stroke();
    },
    
    uid: function(){
        
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = [], i;
        var len = 4;
        var radix = 16;
        radix = radix || chars.length;
        
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
        
        return uuid.join('');
    }
};

$(document).ready(function() {
    var canvas = $('canvas');

    // open a stream to hydna in read/write mode
    var channel = new HydnaChannel('simple-paint.hydna.net/1111', 'rw');

    // draw figure when data is received over channel
    channel.onmessage = function(event) {
        var graph = JSON.parse(event.data);
        if(graph.id != paint.id){
            paint.draw(graph.px, graph.py, graph.x, graph.y, graph.w, graph.c);
        }
    };

    // initiate paint when channel is ready.
    channel.onopen = function() {
        paint.init(canvas, channel);
    };

    $('.picker li').click(function(event) {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
        paint.s_color = $('#color li.active').text();
        paint.s_size = paint.sizes[$('#stroke li.active').text().toLowerCase()];
    });
});
