var W = 400; var H = 400;
var radius = 30;
var N = 10;


var canvas;
var ctx;

var particles = [];

onload = function() {

	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	
	init();
	setInterval(cycle,1);

}

function create_particle() {

	this.x = Math.random()*W;
	this.y = Math.random()*H;

	this.vx = Math.random()*2-1;
	this.vy = Math.random()*2-1;
	
}

function draw() {

	//Lets paint the canvas black
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, W, H);

	//Lets draw particles from the array now
	for(var t = 0; t < particles.length; t++)
	{
		var p = particles[t];
		
      for (var x = -1; x <= 1; x++) {
        for (var y = -1; y <= 1; y++) {
          var tx = p.x + x * W;
          var ty = p.y + y * H;
      
		  if ( tx > -radius && ty > -radius && tx < W + radius && ty < H + radius ) {

			ctx.beginPath();
			ctx.fillStyle = "white";
			ctx.arc(tx, ty, radius, Math.PI*2, false);
			ctx.fill();
     	  }
        }
      }

	}
}

function update_position () {

	for(var t = 0; t < particles.length; t++)
	{
		var p = particles[t];
		
		p.x += p.vx;
		p.y += p.vy;
		
		if( p.x < 0) p.x += W;
		if( p.y < 0) p.y += H;
		if( p.x > W) p.x -= W;
		if( p.y > H) p.y -= H;

	}
}

function cycle() {
	update_position();
	draw();
}

function init() {
	
  	for(var t = 0; t < N; t++)
	{
        particles.push(new create_particle());    
    }
  
}