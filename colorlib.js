// colorlib.js
// v1.0 shabaz 2013 - originally written in C
// v2.0 shabaz November 2016 - modified to JavaScript
// license: free for non-commercial and educational use
// HSVtoRGB routine http://www.cs.rit.edu/~ncs/color/t_convert.html#RGB%20to%20HSV%20&%20HSV%20to%20RGB


var STARTCOL=240;
var ENDCOL=180;

var DIR=1;
var STARTBRIGHT=0.01;
var ENDBRIGHT=1.0;

var SAT=1.0

var span, hcoef, bcoef;

module.exports={
init_hsv: init_hsv,
single2hsv:single2hsv,
single2rgb24: single2rgb24,
single2rgb16: single2rgb16,
col24to16: col24to16,
col565:col565,
HSVtoRGB:HSVtoRGB
}


function init_hsv()
{
	var bspan;
	
	span=0;
	if (STARTCOL==ENDCOL)
	{
		span=360;
	}
	else
	{
		if (DIR)
		{
			if (ENDCOL>STARTCOL)
				span=ENDCOL-STARTCOL;
			else
				span=ENDCOL+(360-STARTCOL);
		}
		else
		{
			if (ENDCOL<STARTCOL)
				span=STARTCOL-ENDCOL;
			else
				span=STARTCOL+(360-ENDCOL);
		}
	}
	hcoef=span/65535;
	
	bspan=ENDBRIGHT-STARTBRIGHT;
	bcoef=bspan/65535;
	
}

function single2hsv (v/*, hsv_t* hsv*/)
{
	var h, s, b;
	// calculate hue
	h=hcoef*v;
	if (DIR)
		h=h+STARTCOL;
	else
		h=h-STARTCOL;
	
	if (h>360)
		h=h-360;
	if (h<0)
		h=h+360;
	
	// calculate brightness (value)
	b=bcoef*v;
	b=b+STARTBRIGHT;
	
	// set the saturation
	s=SAT;

	
	return([h, s, b]);
}

function single2rgb24 ( v/*, rgb_t* rgb*/)
{
	var r, g, b;
	// convert to HSV first
	hsv=single2hsv (v);
	// now convert to RGB
	rgb=HSVtoRGB( hsv[0], hsv[1], hsv[2]);
	// now scale the RGB values to 8-bit each
	r=rgb[0]*255; g=rgb[1]*255; b=rgb[2]*255;
	return([Math.floor(r), Math.floor(g), Math.floor(b)]);
	
}

function single2rgb16 (v/*, unsigned int* pixval*/)
{
	var rgb=[0,0,0];
	rgb=single2rgb24(v);
	pixval=col565(rgb);
        return(pixval);
}

function col24to16(m)
{
	var r, g, b;
	r=(m & 0xff0000)>>16;
	g=(m & 0x00ff00)>>8;
	b=(m & 0x0000ff);
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

function col565(rgb)
{
	var r, g, b;
	//unsigned int r,g,b;
	r=rgb[0];
	g=rgb[1];
	b=rgb[2];
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}


/*
 * Taken from http://www.cs.rit.edu/~ncs/color/t_convert.html#RGB%20to%20HSV%20&%20HSV%20to%20RGB
 */
function HSVtoRGB( /*float *r, float *g, float *b, */  h,  s,  v )
{
	var rgb=[0,0,0];
	var h, i, p, q, t, f;

	if( s == 0 ) {
		// achromatic (grey)
                rbg[0]=v; rgb[1]=v; rgb[2]=v;
		return(rgb);
	}

	h /= 60;			// sector 0 to 5
	i = Math.floor( h );
	f = h - i;			// factorial part of h
	p = v * ( 1 - s );
	q = v * ( 1 - s * f );
	t = v * ( 1 - s * ( 1 - f ) );


	switch( i ) {
		case 0:
			rgb[0] = v;
			rgb[1] = t;
			rgb[2] = p;
			break;
		case 1:
			rgb[0] = q;
			rgb[1] = v;
			rgb[2] = p;
			break;
		case 2:
			rgb[0] = p;
			rgb[1] = v;
			rgb[2] = t;
			break;
		case 3:
			rgb[0] = p;
			rgb[1] = q;
			rgb[2] = v;
			break;
		case 4:
			rgb[0] = t;
			rgb[1] = p;
			rgb[2] = v;
			break;
		default:		// case 5:
			rgb[0] = v;
			rgb[1] = p;
			rgb[2] = q;
			break;
	}

	return(rgb);
}

