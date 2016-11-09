(function() {
  var App;
  App = {};
  /*
  	Init 
  */
  App.init = function() {
    App.canvas = document.createElement('canvas');
    App.canvas.height = 64*4;
    App.canvas.width = 64*4;
    document.getElementsByTagName('article')[0].appendChild(App.canvas);
    App.ctx = App.canvas.getContext("2d");
    App.ctx.fillStyle = "solid";
    App.ctx.strokeStyle = "#ECD018";
    App.ctx.lineWidth = 5;
    App.ctx.lineCap = "round";
    App.socket = io.connect(); 
    App.socket.on('pixdata', function(data) {
      var y=0;
      var x=0;
      for (var i=0; i<(64*64); i++)
      {
        var r=data[i][0];
        var g=data[i][1];
        var b=data[i][2];
        var rgbval=data[i];
        var rgbtxt='rgb('+r+','+g+','+b+')';
        App.ctx.strokeStyle=rgbtxt;
        App.ctx.fillStyle=rgbtxt;
        App.ctx.fillRect(x*4, y*4, 4, 4);
        x++;
        if (x>63){
          x=0;
          y++;
        }
      }
      return(0);
    });
    App.draw = function(x, y, type) {
      if (type === "dragstart") {
        App.ctx.beginPath();
        return App.ctx.moveTo(x, y);
      } else if (type === "drag") {
        App.ctx.lineTo(x, y);
        return App.ctx.stroke();
      } else {
        return App.ctx.closePath();
      }
    };
  };
  /*
  	Draw Events
  */
  $('canvas').live('drag dragstart dragend', function(e) {
    var offset, type, x, y;
    type = e.handleObj.type;
    offset = $(this).offset();
    e.offsetX = e.layerX - offset.left;
    e.offsetY = e.layerY - offset.top;
    x = e.offsetX;
    y = e.offsetY;
    //App.draw(x, y, type);
    //App.socket.emit('drawClick', {
    //  x: x,
    //  y: y,
    //  type: type
    //});
  });
  $(function() {
    return App.init();
  });
}).call(this);

