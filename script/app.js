(function (global) {
'use strict';

var URL                       = 'simple-paint.hydna.net';

var BRUSH_WIDTH               = 8;

var TOUCH_DEVICE              = 'ontouchstart' in global ||
                                'onmsgesturechange' in global;


(function setupController () {
  var userColor = '#e53a3c';
  var input;
  var channel;
  var viewport;
  var elem

  function stateHandler (connected, reason) {
    input.enabled = connected;
    console.log("user id: %s", channel.userId);
    console.log("user count: %s", channel.userCount);
  }

  function dataHandler (data) {
    if ('c' in data == false) {
      data.c = userColor;
      channel.send(data);
    }
    viewport.draw(data);
  }

  elem = document.getElementById('canvas');
  viewport = new CanvasViewport(elem);

  input = TOUCH_DEVICE ? new TouchInterface(elem)
                       : new PointerInterface(elem);

  input.ondata = dataHandler;

  channel = new PaintChannel(URL);

  channel.ondata = dataHandler;
  channel.onstate = stateHandler;
}());



function PaintChannel (url) {
  var self = this;
  var connected = false;
  var channel;
  var userid;

  this.userId = null;
  this.userCount = 0;

  this.send = function (data) {
    data.id = self.userId;
    channel.send(JSON.stringify(data), 2);
  };

  (function setup () {
    channel = new HydnaChannel(url, 'rw');

    channel.onopen = function (event) {
      self.userId = event.data.split(',')[0];
      self.userCount = parseInt(event.data.split(',')[1]);
      connected = true;
      self.onstate(connected);
    };

    channel.onsignal = function (event) {
      self.userCount = parseInt(event.data);
      self.onstate(connected);
    }

    channel.onmessage = function (event) {
      try {
        var data = JSON.parse(event.data);
        if (data.id != userid) {
          self.ondata(data);
        }
      } catch (encodingError) {
      }
    };

    channel.onclose = function (event) {
      self.userId = null;
      self.userCount = 0;
      connected = false;
      self.onstate(connected, event.reason);
      if (event.hadError) {
        return setTimeout(setup, 3000);
      }
    };
  }());
}


function TouchInterface (target) {
  var self = this;
  var moves = null;

  this.enabled = false;

  function relativePos (t) {
    return { x: t.pageX - t.target.parentNode.offsetLeft,
             y: t.pageY - t.target.parentNode.offsetTop };
  }

  target.addEventListener('touchstart', function (event) {
    var touch;

    if (self.enabled == false) {
      return;
    }

    event.preventDefault();

    moves = moves || {};

    for (var i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i];
      moves[touch.identifier] = relativePos(touch);
    }
  });

  target.addEventListener('touchmove', function (event) {
    var touch;
    var data;
    var move;
    var pos;

    if (!moves || self.enabled == false) {
      return;
    }

    event.preventDefault();

    for (var i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i];

      if (!(move = moves[touch.identifier])) {
        continue;
      }

      pos = relativePos(touch);
      data = { x: pos.x, y: pos.y, px: move.x, py: move.y };

      self.ondata(data);

      moves[touch.identifier] = pos;
    }
  });

  target.addEventListener('touchend', function (event) {
    var touch;

    if (!moves) {
      return;
    }

    event.preventDefault();

    for (var i = 0; i < event.changedTouches.length; i++) {
      touch = event.changedTouches[i];
      if (touch.identifier in moves) {
        delete moves[touch.identifier];
      }
    }

    if (Object.keys(moves) == 0) {
      moves = null;
    }
  });
}


function PointerInterface (target) {
  var self = this;
  var state = null;

  this.enabled = false;

  function handler (name, callback) {
    if (target.attachEvent) {
      target.attachEvent('on' + name, callback);
    } else {
      target.addEventListener(name, callback);
    }
  }

  handler('mousedown', function (event) {
    if (self.enabled == false) {
      return;
    }

    state = { x: event.offsetX, y: event.offestY };

    return false;
  });

  handler('mousemove', function (event) {
    var data;

    if (!state || self.enabled == false) {
      return;
    }

    data = { x: event.offsetX, y: event.offsetY, px: state.x, py: state.y };

    self.ondata(data);

    state = { x: event.offsetX, y: event.offsetY };

    return false;
  });

  handler('mouseup', function (event) {
    state = null;
    return false;
  });
}


function CanvasViewport (target) {
  var context = target.getContext('2d');

  target.onselectstart = function() { return false; };

  this.draw = function (data) {
    context.strokeStyle = data.c;
    context.beginPath();
    context.moveTo(data.px, data.py);
    context.lineTo(data.x, data.y);
    context.lineWidth = BRUSH_WIDTH;
    context.lineCap = 'round';
    context.stroke();
  };
}


}(this));