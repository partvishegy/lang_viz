var win;

var padding = 3,	// think about these plz.
	maxRadius = 3;

// define fixed clusters - make dynamic later
var clusters = [
	{name: 0, xx:150, yy:280},
	{name: 1, xx:360, yy:120},
	{name: 2, xx:570, yy:280}
	]

// sample word data
var words = [
	{"name" : "w1", "x"	: 100, "y"	: 201, "cluster": 1, "r":5, "sched":[1,1,2,0]},
	{"name" : "w2", "x"	: 200, "y"	: 202, "cluster": 2, "r":5, "sched":[2,0,1,2]},
	{"name" : "w7", "x" : 234, "y"	: 101, "cluster": -1, "r":30, "sched":[-1,-1,0,1]},
	{"name" : "w8", "x" : 204, "y"	: 11, "cluster": 1, "r":10, "sched":[1,-1,1,-1]}]

// generate more fake words, for testing
d3.range(30	).map(function(i){
	words.push(
		{"name":"w".concat(i+9),
		  "x": Math.ceil(Math.random()*400),
		  "y": Math.ceil(Math.random()*300),
		  "cluster": Math.ceil(Math.random()*clusters.length-1),
		  "r": 5,
		  "sched": Array.apply(null, {length: 4}).map(Function.call, // updeate length with last_win
		   function(){return Math.ceil(Math.random()*clusters.length-1)})
		})
	});


var selected_words = []
	words_alive = []
	words_dead  = []


// add (random) color to words
words.map(function(d){
	/*console.log(d)*/
	var h = Math.ceil(Math.random() * 360)
	d.color = "hsla("+h.toString()+", 100%, 20%, 0.5)";
});

var word_count = words_alive.legth // update in update birth and death.


function draw(data) {
	"use strict"
	console.log(data)

	var last_win = words[0].sched.length-1
	// data[data.length-1].birth + data[data.length-1].xx.length -1

	var dimensions = {width: 750, height: 500}

	//svg behaviour
	var zoom = d3.behavior.zoom()
	    .scaleExtent([1, 10])
	    .on("zoom", zoomed);
	var drag = d3.behavior.drag()
	    .origin(function(d) { return d; })
	    .on("dragstart", dragstarted)
	    .on("drag", dragged)
	    .on("dragend", dragended);

	// set up main svg container
	var chart_disp = d3.select("#chart_disp")//.style("border", "dashed black")
		.append("svg")
			.attr("width", dimensions.width)
			.attr("height", dimensions.height)
		.append("g")
    		.call(zoom);

    //improve clickability
    var rect = chart_disp.append("rect")
    .attr("class", "drag_zoom")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .style("fill", "none")
    .style("pointer-events", "all");

    // improve visibility - just for testing!
    var container = chart_disp.append("g");
    container.append("g")
	    .attr("class", "x axis")
	  .selectAll("line")
	    .data(d3.range(0, dimensions.width, 10))
	  .enter().append("line")
	    .attr("x1", function(d) { return d; })
	    .attr("y1", 0)
	    .attr("x2", function(d) { return d; })
	    .attr("y2", dimensions.height);
	container.append("g")
	    .attr("class", "y axis")
	  .selectAll("line")
	    .data(d3.range(0, dimensions.height, 10))
	  .enter().append("line")
	    .attr("x1", 0)
	    .attr("y1", function(d) { return d; })
	    .attr("x2", dimensions.width)
	    .attr("y2", function(d) { return d; });


	win = 0; // update window value with back and forth buttons & slide!
	console.log(win)


	// sort words to alive and dead lists
	words.forEach(function(w){
		if (w.cluster === -1){
			words_dead.push(w)
		}else{
			words_alive.push(w)
		}
	});

	// cluster areas: just for testing (?)
	container.selectAll("circle.cluster")
		.data(clusters)
		.enter()
		.append("circle")
			.attr("class", "cluster")
			.attr("cx", function(d){return d.xx})
			.attr("cy", function(d){return d.yy})
			.attr("r", 40)

	// define div for tooltip
	var div = d3.select("body").append("div")	
	    .attr("class", "tooltip")				
	    .style("opacity", 0);

	// navigational buttons
	d3.select("#forth")
		.on("click", function(){
			if (win!=last_win){
				win+=1
			}
		update_words()

		//update slide pos
		$("#time").val(win)
		
		console.log(win)
		});

	d3.select("#back")
		.on("click", function(){
			if (win!=0){
				win-=1
			}
		update_words()

		//update slide pos
		$("#time").val(win)

		console.log(win)
		});

	// PULSE button
	d3.select("#pulse_button")
		.on("click", pulse_all);


	// init force layout 
	var force = d3.layout.force()
		.nodes(words_alive)
		.size([dimensions.width, dimensions.height])
		// .links([])
		.gravity(0)
		.charge(0) // temperature?
		.friction(.9)
		.on("tick", tick)
		.start();

	// words alive in init state
	container.selectAll("circle.word")
		.data(words_alive)
	  	.enter()
	  	.append("circle")
		  	.attr("class","word")
            .attr("cx", function(d){return d.x})
            .attr("cy", function(d){return d.y})
			.attr("r", function(d){return d.r})
			.attr("id", function(d){return d.name})
			.attr("fill", function(d){return d.color})
			.call(drag)
			.on("dblclick", select_word);
    tooltip();

    d3.select("#time").on("input", function() {
    	update_time(+this.value);
    });

    //update time by slide position
    function update_time(t){
    	console.log("time updated by slide! woooooot!"  + t)
    	win = t;
    	d3.select("#time").on("mouseup", update_words);
    };

	function update_words(){
		// update sched, check who is alive, call death and birth.
		// ----------------------
		$("p#t").text("t = " + win)

		var d_list = []
		var b_list = []

		d3.range(words.length).map(function(i){
			var w = words[i]
			var last_clust = w.cluster
			w.cluster = w.sched[win]
			
			if (last_clust !== -1 && w.cluster === -1){
				d_list.push(w)
			}
			if (last_clust === -1 && w.cluster !== -1){
				b_list.push(w)
			}

			force.resume()
		});
		console.log(b_list)

		if (b_list.length>0){
			birth(b_list)
		}
		if (d_list.length>0){
		death(d_list)
		}
		d_list = []
		b_list = []
		console.log(b_list)

		update_info_divs()
	};


	function birth(b_list){
		b_list.forEach(function(o,i){
			var id = words_dead.indexOf(o);
			words_dead.splice(id,1);
			words_alive.push(o);
		});

		force.nodes(words_alive).start();	
		
		var newborns = container.selectAll("circle.word").data(words_alive, function(d){return d.name;})
		.enter()
		.append("circle")
			.attr("class", function(d){
				if (selected_words.indexOf(d)>=0){
					return "word selected_word";
				}else{
				  	return "word"}})
            .attr("cx", function(d){return d.x})
            .attr("cy", function(d){return d.y})
			.attr("id", function(d){return d.name})
			.attr("fill", function(d){return d.color})
			.attr("r", 1)
			.call(drag)
			.on("dblclick", select_word);
		tooltip();

		newborns.transition().duration(2000)
		  	.attr("r", function(d){return d.r});
		// the transition still gives a seemingly irrelevant typeError. this may cause problems.
		// if so, we can get rid of the transition, and just let the newborns pop up.
	};


	function death(d_list){
		d_list.forEach(function(o,i){
			var id = words_alive.indexOf(o);
			words_alive.splice(id,1);
			words_dead.push(o);
		});

		container.selectAll("circle.word").data(words_alive, function(d){return d.name;})
		.exit()	// use "key function" for object consistency
			.transition()
			.duration(2000)
			.attr("r", 0)
			.remove()
	};

	// add tooltip to words
	function tooltip(){
	chart_disp.selectAll("circle.word")
	.on("mouseover", function(d) {
			d3.select("#" + d.name).attr("fill", "blue")
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div	.html(d.name + "<br/>cluster:"  + d.cluster + "<br/>freq:"  + d.r)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function(d) {
        	d3.select("#" + d.name).attr("fill", d.color)	
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	
        });
    };


	function select_word(e){
		console.log(e.name)
		var sel = d3.select("#" + e.name)

		if (!sel.classed("selected_word")){
			sel.classed("selected_word", true)
			selected_words.push(e)
		}else{
			sel.classed("selected_word", false)
			var i = selected_words.indexOf(e)
			selected_words.splice(i,1)
		};

		update_info_divs()

	};

	function update_info_divs(){
		d3.selectAll("div.selected_w_div")
			.data(selected_words)
			.style("background", function(d){if (d.cluster==-1){
												return "lightgrey"
											}else{	
												return "yellow"}})
			.html(function(d){return "<b>"+d.name+"</b>" + "</br>current cluster: "  + d.cluster + "<br/>last five clusters:<br/>" + d.sched})
				.on("click", pulse_me
				);
	};

	function pulse_me(e){
		if (e.cluster !== -1){
			var let_pulse = Array(e)
		}
		pulse(let_pulse);
	};

	function pulse_all(){
		var let_pulse = selected_words.filter(function(el){
		  return words_dead.indexOf(el) < 0;
		});
		pulse(let_pulse);
	}
	
	function pulse(let_p){
		console.log("PUSLE clicked!")

		var pulses = container.selectAll("circle.pulse")
			.data(let_p, function(d){return d.name}) // set op? "{selected | selected not dead} ?"
			.enter()
			.append("circle")
			.attr("class", "pulse")
			.attr("cx", function(d){return d.x})
			.attr("cy", function(d){return d.y})
			.attr("r", function(d){return d.r})
			.attr("pointer-events", "none")
			.attr("fill", "hsla(0, 0%, 0%, 0)")
			.attr("stroke", "hsla(120, 100%, 20%, 0.7)")
			.attr("stroke-width", 5);


		pulses.transition().duration(1000).ease("linear")
			.attr("r", 150)
			.style('opacity', 1)
			.attr("stroke-width", 0)
			.remove()
		};


	function tick(e) {
		console.log("tick!")
		var k = 0.04 * e.alpha;

		// Push nodes toward their designated focus.
		words_alive.forEach(function(o, i) {
/*			console.log(o.name)
			console.log(o.cluster)*/
			// approach cluster focus
			o.y += (clusters[o.cluster].yy - o.y) * k; 
			o.x += (clusters[o.cluster].xx - o.x) * k;
		});

		chart_disp.selectAll("circle.word") //words_dots selection
			  .each(collide(.5))
		  .attr("cx", function(d){return d.x}) //console.log(d.name);
		  .attr("cy", function(d){return d.y});
	};

	// Resolve collisions between nodes.
	function collide(alpha) {// alpha is a coolig parameter. 
	  var quadtree = d3.geom.quadtree(words_alive);	
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

	// svg behaviour functions
	function zoomed(){
  		container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	};

	function dragstarted(d){
		d3.event.sourceEvent.stopPropagation();
		d3.select(this).classed("dragging", true);
		force.resume()
	};
	function dragged(d){
		d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
	};
	function dragended(d){
		d3.select(this).classed("dragging", false);
	};
	//----------------------------------------

}; // end of draw



// TODO
	// create fake word data, by clicks for now. later we invent json data. - done for now.
	// make word object find their clusters (mbostock collide funtion! <3)	- done!

	// some of the words wont appear. debug! - done
	// clean up code a little bit 			 - done, kinda => jslint!

	// multiple words take the same place, debug! - done

	// add more word_dots 		   - done. for now
	// add random colors, for fun  - done
	
	// add more complex word objects - done
	// create chedules for them  - done 
	// connect update function to buttons - done

	// add word birth and death - done

	// add word selection - done
	// add pulse 		- done
	// fix consistency of pulse and drag - done
	// add tooltip
	// add time-slide, connect it fully - done
	// add info divs, individual pulse!
	// add zoom and drag to svg
	// ----------------------------------

	// use real data, and thik of a way to arrange the clusters
	// add ticks and clever time tags to timeline!
	
	// jslint!

	// esetleg legyen egy path/history function, ami behúz egy vonalat akorbban látogatott clusterek között!
	

	// a clusterek kréméjét fogjuk megjeleníteni...
		// az lenne valószínűleg ideális, ha csak azok a clusterek jelennének meg, amikben valaha előfordul
		// a kiválasztott szavak valamelyike

// later but super important!
	// lehessen gombbal és autoplay-jel is haladni az időben
	// legyen érthető, szép idősáv, amin követhető, hogy hol tartunk
	// legyenek meg az időben széthúzott hisztogrammok (milyen jellemzők?)
	

// ---------------------------------------------
//a cluster birth és death nagyon egyszerű lesz:
	// birthnél new focus is created
	// deathnél először a szavak megkapják az új helyüket, aztán a halott focit kivesszük.
		// ilyenkor majd újrarendezzük a maradék focit. (az még kérdés, hogy mennyire lesz dinamikus a helyük, de aszerint)
