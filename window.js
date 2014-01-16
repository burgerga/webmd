var W = 400; var H = 400;
var N = 10;
var rc = 2.5;
var rc2 = rc * rc;
var rc3i = 1.0 / (rc * rc * rc);
var rho = 0.6;
var L = 0.0;
var hL = 0.0;
var ecor = 8 * Math.PI * rho * ( rc3i * rc3i * rc3i / 9.0 - rc3i / 3.0);
var ecut = 4 * ( rc3i * rc3i * rc3i * rc3i - rc3i * rc3i);
var dt = 0.003;
var dt2 = dt * dt;
var T0 = 2.0;
var ke = 0.0;
var pe = 0.0;
var te = 0.0;
var drawFactor = 0.0;
var drawRadius = 0.0;

var canvas;
var ctx;

var particles = [];

onload = function() {

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  
  console.log("Initializing...");
  init();
  draw();
  calc_energy();
  console.log("Starting main loop");
  setInterval(cycle,1);
  //cycle();

}

function draw() {
  //Lets paint the canvas black
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, W, H);

  //Lets draw particles from the array now
  for(var t = 0; t < particles.length; t++) {
    var p = particles[t];
    //console.log("%d: %f %f", t, p.x, p.y); 
    for (var x = -1; x <= 1; x++) {
      for (var y = -1; y <= 1; y++) {
        var tx = p.x + x * L;
        var ty = p.y + y * L;
      
        //If potentially visible draw it.
        if ( tx > -0.5 && ty > -0.5 && tx < L + 0.5 && ty < L + 0.5 ) {
          var px = Math.round(tx * drawFactor);
          var py = Math.round(ty * drawFactor);
          ctx.beginPath();
          ctx.fillStyle = "white";
          ctx.arc(px, py, drawRadius, Math.PI*2, false);
          ctx.fill();
        } //end if
      } //end for y
    } //end for y
  } //end for t
} //end function draw

function update_position () {
  for(var t = 0; t < particles.length; t++) {
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
  integration_step1();
  calc_energy();
  integration_step2();

  draw();
}

function init() {
  //Find optimal square
  var dim = Math.ceil(Math.sqrt(N));
  var V = N / rho;
  L = Math.sqrt(V);
  hL = L / 2.0;
  var dist = L * 1.0 / dim;
  drawFactor = W / L;
  drawRadius = Math.floor(drawFactor / 2.0);
  console.log("%f",drawRadius);

  console.log("Creating particles...");
  var x = 0;
  var y = 0;
  for(var i = 0; i < N; i++) {
    particles.push(new function() {
      this.x = (x + 0.5) * dist;
      this.y = (y + 0.5) * dist;
      this.vx = Math.random()*2-1;
      this.vy = Math.random()*2-1;
      this.fx = 0.0;
      this.fy = 0.0;
    });    
    x++;
    if (x === dim) {
      x = 0;
      y++;
    }
  }

  console.log("Computing center-of-mass drift...");
  //Compute initial KE and take away center-of-mass drift.
  var cmvx = 0.0;
  var cmvy = 0.0;
  for(var i = 0; i < N; i++) {
    var p = particles[i];
    cmvx += p.vx;
    cmvy += p.vy;
  }
  console.log("Correcting center-of-mass drift and computing kinetic energy...");
  ke = 0;
  for(var i = 0; i < N; i++) {
    var p = particles[i];
    p.vx -= cmvx / N;
    p.vy -= cmvy / N;
    ke += p.vx * p.vx + p.vy * p.vy;
  }
  ke *= 0.5;

  console.log("Scale velocities to right initial temperature...");
  //Scale the velocities
  var T = ke / N * 2.0 / 3.0;
  var factor = Math.sqrt(T0 / T);
  for(var i = 0; i < N; i++) {
    var p = particles[i];
    p.vx *= factor;
    p.vy *= factor;
  }
  ke *= factor * factor;
}

function integration_step1() {
  for ( var i = 0; i < N; i++ ) {
    var p = particles[i];
    p.x += p.vx * dt + 0.5 * dt2 * p.fx;
    p.y += p.vy * dt + 0.5 * dt2 * p.fy;
    if( p.x < 0) p.x += L;
    if( p.y < 0) p.y += L;
    if( p.x > L) p.x -= L;
    if( p.y > L) p.y -= L;
    p.vx += 0.5 * dt * p.fx;
    p.vy += 0.5 * dt * p.fy;
  }
}

function integration_step2() {
  for ( var i = 0; i < N; i++ ) {
    var p = particles[i];
    p.vx += 0.5 * dt * p.fx;
    p.vy += 0.5 * dt * p.fy;
  }
}

function calc_energy() {

  var energy = 0.0;

  // Zero the forces.
  for(var i = 0; i < N; i++) {
    var p = particles[i];
    p.fx  = 0.0;
    p.fy  = 0.0;
  }

  for(var i = 0; i < N - 1; i++) {
    var pi = particles[i];
    for(var j = i + 1; j < N; j++) {
      var pj = particles[j];
      // Get the distance between 2 particles
      var dx = pi.x - pj.x;
      var dy = pi.y - pj.y;
      // Apply nearest image convention
      if (dx > hL)       dx -= L;
      else if (dx < -hL) dx += L;
      if (dy > hL)       dy -= L;
      else if (dy < -hL) dy += L;
      var r2 = dx * dx + dy * dy; 
      if (r2 < rc2) {
        // r6i is sigma6 / r^6 (r2^3)
        var r6i = 1 / (r2 * r2 * r2);
        energy += 4 * (r6i * r6i - r6i) - ecut;
        var f = 48 * (r6i * r6i - 0.5 * r6i);
        pi.fx += dx * f / r2;
        pj.fx -= dx * f / r2;
        pi.fy += dy * f / r2;
        pj.fy -= dy * f / r2;
      }
    }
  }
  return energy + N * ecor;

}
