var win;

var padding = 3,	// think about these plz.
	maxRadius = 3;

// define fixed clusters - make dynamic laterz
var clusters = [
	{name: 1, xx:150, yy:280},
	{name: 2, xx:360, yy:120},
	{name: 3, xx:570, yy:280}
	]

// we will need real words later, but now we just click a few ==> random_dot()
var words = [
	{"name" : "V1", "x"	: 100, "y"	: 200, "cluster": 1, "r":5},
	{"name" : "V2", "x"	: 200, "y"	: 200, "cluster": 2, "r":5},
	{"name" : "V3", "x"	: 100, "y"	: 100, "cluster": 3, "r":5},
/*	{"name" : "V4", "x"	: 150, "y"	: 250, "cluster": 1, "r":5},
	{"name" : "V5", "x"	: 200, "y"	: 200, "cluster": 2, "r":5},
	{"name" : "V6", "x"	: 100, "y"	: 100, "cluster": 3, "r":5},
	{"name" : "V7", "x"	: 150, "y"	: 250, "cluster": 1, "r":5},
	{"name" : "V8", "x"	: 200, "y"	: 200, "cluster": 2, "r":5},
	{"name" : "V9", "x"	: 100, "y"	: 100, "cluster": 3, "r":5},
	{"name" : "V10","x" : 150, "y"	: 250, "cluster": 1, "r":5},*/
	{"name" : "V11","x" : 200, "y"	: 100, "cluster": 2, "r":5}
	]

var word_count = 0


function draw(data) {
	"use strict"
	console.log("running!")
	console.log(data)//.xx.length

	var last_win = data[data.length-1].birth + data[data.length-1].xx.length -1

	var container_dimensions = {width: 900, height: 400}

	// main svg container
	var chart_disp = d3.select("#chart_disp")//.style("border", "dashed black")
		.append("svg")
			.attr("width", container_dimensions.width)
			.attr("height", container_dimensions.height);


	win = 0; /*update window value with back and forth buttons!*/
	console.log(win)


	function update_frame(){
		console.log("frame updated!")
	}
/*		chart_disp.selectAll("circle")
		.transition()
			.attr("cx", function(d){return d.xx[win]})
			.attr("cy", function(d){return d.yy[win]})
			.attr("r", function(d){return d.fake1[win]*20})
			.attr("fill", function(d){var h = d.fake2[win]*360;
									  return "hsla("+h.toString()+", 100%, 20%, 0.5)"}); 
									  // ezt majd átkonverálhatjuk heat palettára
	}*/


	chart_disp.selectAll("circle.cluster")
		.data(clusters)
		.enter()
		.append("circle")
			.attr("class", "cluster")
			.attr("cx", function(d){return d.xx})
			.attr("cy", function(d){return d.yy})
			.attr("r", 80)

	// navigational buttons
	d3.select("#forth")
		.on("click", function(){
			if (win!=last_win){
				win+=1
			}
		update_frame()
		
		console.log(win)
		});

	d3.select("#back")
		.on("click", function(){
			if (win!=0){
				win-=1
			}
		update_frame()

		console.log(win)
		});




	var force = d3.layout.force()
		.nodes(words)
		.size([container_dimensions.width, container_dimensions.height])
		// .links([])
		.gravity(0)
		.charge(0) // ezt még haszon lehet
		.friction(.9) // .9 volt
		.on("tick", tick)
		.start();

	var word_dots = chart_disp.selectAll("circle.word")
		.data(words)
	  	.enter()
	  	.append("circle")
		  	.attr("class","word")
            .attr("cx", function(d){return d.x})
            .attr("cy", function(d){return d.y})
			.attr("r", 5) // az x és y koordináták elvieg a layout.force-ból jönnek!
			.attr("id", function(d){return d.name})
			/*.style("fill", function(d) { return d.color; });*/
			.call(force.drag);


//----------------------------------------
	function tick(e) {
		console.log("tick!")
		var k = 0.04 * e.alpha;

		// Push nodes toward their designated focus.
		words.forEach(function(o, i) {
/*		var curr_act = o.act;

		// Make sleep more sluggish moving.
		if (curr_act == "0") {
			var damper = 0.6;
		} else {
			var damper = 1;
		}
		o.color = color(curr_act);*/
			console.log([o.x, o.y])
			o.y += (clusters[o.cluster-1].yy - o.y) * k; // itt updateli a focinak megfelelően!
			o.x += (clusters[o.cluster-1].xx - o.x) * k;	// akkor nem tudom mi történik a timerben cx-szel, de mindegy is.
		});

		// ok, e.alpha folyamatosan csökken, minden tick-nél.
		// mégis kell az a damper?

		word_dots
			  .each(collide(.5))
			  /*.style("fill", function(d) { return d.color; })*/
		  .attr("cx", function(d) { return d.x; })
		  .attr("cy", function(d) { return d.y; });
		}


	// Resolve collisions between nodes.
	function collide(alpha) {					// alpha is a coolig parameter. 
	  var quadtree = d3.geom.quadtree(words);	
	  return function(d) {
	    var r = d.r + maxRadius + padding + 10,
	        nx1 = d.x - r,
	        nx2 = d.x + r,
	        ny1 = d.y - r,
	        ny2 = d.y + r;
	    quadtree.visit(function(quad, x1, y1, x2, y2) {
	      if (quad.point && (quad.point !== d)) {
	        var x = d.x - quad.point.x,
	            y = d.y - quad.point.y,
	            l = Math.sqrt(x * x + y * y),
	            r = d.r + quad.point.r + (d.act !== quad.point.act) * padding;
	        if (l < r) {
	          l = (l - r) / l * alpha;
	          d.x -= x *= l;
	          d.y -= y *= l;
	          quad.point.x += x;
	          quad.point.y += y;
	        }
	      }
	      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
	    });
	  };
	};
	//----------------------------------------

}; // end of draw


// force.resume()  lehet, hogy ez hiányzik?	
// nincs saját radius attribútuma a word_dot objecteknek! ezért nem tartja a távot a collide!



// TODO
	// create fake word data, by clicks for now. later we invent json data. - done for now.
	// make word object find their clusters (mbostock collide funtion! <3)	- done!

	// some of the words wont appear. debug! - done
	// clean up code a little bit 			 - done, kinda

	// multiple words take the same place, debug! - done

	// add more dots
	// add random colors, for fun
	
	// add more complex word objects
		// create chedules for them
		// make update function

		// there might be some flow problems with word birth and death
	















