// Behaviors for Hydna Paint

behavior('/{wildcard}', {
    open: function (event) {
        event.channel.incr('active-users', function (err, count) {
            if (err) {
                event.deny(err);
            }
            event.channel.emit(String(count));
            event.allow(String(event.connection.id) + ',' + String(count));
        });
    },
    close: function (event) {
        event.channel.decr('active-users', function (err, count) {
            if (err) {
                return;
            }
            event.channel.emit(String(count));
        });
    }
});