#!/usr/bin/node
// grid-EYE thermal imager
// v1.0 shabaz November 2016
// license: free for non-commercial and educational use
//
// don't forget to change the line containing 'progpath' to suit your needs
// 
var noble=require('noble');
var matrix=require('sense-hat-led');
var colorlib=require('./colorlib');
var imagelib=require('imagejs');
var app=require('http').createServer(handler);
var io=require('socket.io').listen(app);
var fs=require('fs');
var progpath='/home/shabaz/grid-eye/';

var GRIDEYE_SERVICE_UUID = '0783b03e8535b5a07140a304d2495cb7';
var GRIDEYE_DATA_CHAR_UUID = '0783b03e8535b5a07140a304d2495cb8';
var GRIDEYE_UNK1_CHAR_UUID = '0783b03e8535b5a07140a304d2495cb9';
var GRIDEYE_UNK2_CHAR_UUID = '0783b03e8535b5a07140a304d2495cba';

var pixread=0;
var stored=0;
var storedval=0;
var framedone=0;
var sock_connected=0;

var X = [255,255,255];  // White
var O = [0,0,0];  // Black

var frame = [
O, O, O, X, X, O, O, O,
O, O, X, O, O, X, O, O,
O, O, O, O, O, X, O, O,
O, O, O, O, X, O, O, O,
O, O, O, X, O, O, O, O,
O, O, O, X, O, O, O, O,
O, O, O, O, O, O, O, O,
O, O, O, X, O, O, O, O
];

var bigframe=[];

var smallbm=new imagelib.Bitmap({width: 8, height: 8, data: new Buffer(4*8*8)});

app.listen(8081);
colorlib.init_hsv();
matrix.setPixels(frame);

noble.on('stateChange', function(state){
  if (state==='poweredOn'){
    console.log('scanning..');
    noble.startScanning([GRIDEYE_SERVICE_UUID], false);
    //noble.startScanning([], true);
  }
  else {
    noble.stopScanning();
  }
})

var grideye_service=null;
var grideye_data_char=null;
var grideye_unk1_char=null;
var grideye_unk2_char=null;

noble.on('discover', function(peripheral){
  noble.stopScanning();
  console.log('found: ', peripheral.advertisement);
  peripheral.connect(function(err){
    peripheral.discoverServices([GRIDEYE_SERVICE_UUID], function(err, services){

      services.forEach(function(service){
        console.log('found service: ', service.uuid);
        service.discoverCharacteristics([], function(err, characteristics){
          characteristics.forEach(function(characteristic) {
            console.log('found characteristic:', characteristic.uuid);
            if (GRIDEYE_DATA_CHAR_UUID == characteristic.uuid){
              grideye_data_char = characteristic;
            }
            else if (GRIDEYE_UNK1_CHAR_UUID == characteristic.uuid){
              grideye_unk1_char = characteristic;
            }
            else if (GRIDEYE_UNK2_CHAR_UUID == characteristic.uuid){
              grideye_unk2_char = characteristic;
            }
          }) // end characteristics.forEach
          // check to see if we found all desired characteristics
          if (grideye_data_char && grideye_unk1_char && grideye_unk2_char){
            grideye_func();
          }
          else {
            console.log('Error, some characteristics were missing');
          }
        }) // end service.discoverCharacteristics
      }) // end services.forEach
    }) // end peripheral.discoverServices
  }) // end peripheral.connect
}) // end noble.on

function grideye_func(){
  grideye_data_char.on('read', function(data, isNotification){
    if ((pixread==0) && data.length>3){
      if((data[0]==0x2a) && (data[1]==0x2a) && data[2]==(0x2a)){
        for (var i=5; i<(data.length-1); i=i+2){
          tval=((data[i+1] & 0x07)<<8) | data[i];
          if (0 != (0x08 & data[i+1])){
            tval=tval-2048;
          }
          cval=tval*0.25;
          pixdata=temp2pixel(cval);
          //cval=Math.floor(tval*0.25);
          //pixdata=[cval, cval, cval];
          frame[pixread]=pixdata;
          pixread++;
       
        }// end for
        if (data.length%2==0){
          stored=1;
          storedval=data[data.length-1];
        }
        else {
          stored=0;
        }
      } // end if data[0]==0x2a
    } // end if pixread==0
    else if ((pixread>0) && (pixread<64))
    {
      for (var i=0; i<(data.length-1); i=i+2){
        if (stored){
          tval=((data[i] & 0x07)<<8) | storedval;
          if (0 != (0x08 & data[i])){
            tval=tval-2048;
          }
          storedval=data[i+1];
        }
        else {
          tval=((data[i+1] & 0x07)<<8) | data[i];
          if (0 != (0x08 & data[i+1])){
            tval=tval-2048;
          }
        }
        cval=tval*0.25;
        pixdata=temp2pixel(cval);
        frame[pixread]=pixdata;
        pixread++;
        if (pixread>63){
          // we are done with the frame
          framedone=1;
          i=data.length; // we are done
        }
      } // end for 
      if (data.length%2==0){
      }
      else {
        if ((stored==1) && (pixread<64)){
          // process the last received pair and clear stored
          tval=((data[data.length-1] & 0x07)<<8) | data[data.length-2];
          if (0 != (0x08 & data[data.length-1])){
            tval=tval-2048;
          }
          cval=tval*0.25;
          pixdata=temp2pixel(cval);
          frame[pixread]=pixdata;
          pixread++;
          stored=0;
          if (pixread>63){
            framedone=1;
          }
        } // end if ((stored==1
        else if ((stored==0) && (pixread<64)){
          // we need to store
          stored=1;
          storedval=data[data.length-1];
        }
      }
      if (framedone)
      {
        matrix.setPixels(frame);
        pixread=0;
        framedone=0;
        stored=0;
        doimage();
      }
    } // end else if (pixread<64)
    else
    {
    }

  }) // end grideye_data_char.on('read'

} // end function grideye_func

function temp2pixel(cval){


  rgb=colorlib.single2rgb24((cval-19)*1700);
  return(rgb);
}

function doimage(){
  var index=0;
  for (var iy=0; iy<8; iy++)
  {
    for (var ix=0; ix<8; ix++)
    {
      smallbm.setPixel(ix, iy, frame[index][0], frame[index][1], frame[index][2], 255);
      index++;
    }
  }
  var bigbm=smallbm.resize({width:64, height:64, algorithm: "bilinearInterpolation"});
  index=0;
  var getcol={};
  for (var iy=0; iy<64; iy++)
  {
    for (var ix=0; ix<64; ix++)
    {
      getcol=bigbm.getPixel(ix, iy, getcol);
      bigframe[index]=[getcol.r, getcol.g, getcol.b];
      index++;
    }
  }      


  if (sock_connected)
  {
    io.emit('pixdata', bigframe);
  }

    
    
}

function handler(req, res){
  console.log('url is '+req.url.substr(1));
  reqfile=req.url.substr(1);
  fs.readFile(progpath+reqfile, function(err, data){
    if(err){
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function(socket){
  sock_connected=1;
});

