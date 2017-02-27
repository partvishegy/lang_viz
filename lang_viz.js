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
	{"name" : "w7", "x" : 234, "y"	: 101, "cluster": -1, "r":10, "sched":[-1,-1,0,1]}
	]

// generate more fake words, for testing
d3.range(1).map(function(i){
	words.push(
		{"name":"w".concat(i+3),
		  "x": Math.ceil(Math.random()*400),
		  "y": Math.ceil(Math.random()*300),
		  "cluster": Math.ceil(Math.random()*clusters.length-1),
		  "r": 5,
		  "sched": Array.apply(null, {length: 4}).map(Function.call, // updeate length with last_win
		   function(){return Math.ceil(Math.random()*clusters.length-1)})

		})
	});

var words_alive = []
var words_dead  = []
var word_dots;


// now init "cluster" and sched[0] hold the same value, but one is for current pos, one is for memory!

// alternative way if the full list does not prove to be practical:
// "sched":[{"next_move":2, "dest_clust":0},{"next_move":3, "dest_clust":2}]

// calculate additional values for words and clusters based on their attribs

// add (random) color to words! add pos = 0. why would i write it in the data?
words.map(function(d){
	console.log(d)
	var h = Math.ceil(Math.random() * 360)
	d.color = "hsla("+h.toString()+", 100%, 20%, 0.5)";
	//d.sch_pos = 0; // schedule position. - wont be needed if we implement fullist.

})

var word_count = words_alive.legth // update in update birth and death.


function draw(data) {
	"use strict"
	console.log("running!")
	console.log(data)//.xx.length

	var last_win = words[0].sched.length-1
	// data[data.length-1].birth + data[data.length-1].xx.length -1

	var dimensions = {width: 750, height: 400}

	// main svg container
	var chart_disp = d3.select("#chart_disp")//.style("border", "dashed black")
		.append("svg")
			.attr("width", dimensions.width)
			.attr("height", dimensions.height);


	win = 0; /*update window value with back and forth buttons!*/
	console.log(win)


	// sort words to alive and dead lists
	words.forEach(function(w){
		//console.log(w)
		if (w.cluster === -1){
			words_dead.push(w)
		}else{
			words_alive.push(w)
		}
	});


	function update_words(){
		// check who is alive: call death and birth functions.
		// ----------------------
		d3.range(words.length).map(function(i){
			//w = words[i]
			// console.log(words[i].name)

			var last_clust = words[i].cluster

			words[i].cluster = words[i].sched[win] // ezt majd az alive-ban akarjuk frissíteni! illetve mindegy.
			
			if (last_clust === -1 && words[i].cluster !== -1){
				birth(words[i])
			}
			if (last_clust !== -1 && words[i].cluster === -1){
				death(words[i])
			}

			force.resume()
		});
	}


	chart_disp.selectAll("circle.cluster")
		.data(clusters)
		.enter()
		.append("circle")
			.attr("class", "cluster")
			.attr("cx", function(d){return d.xx})
			.attr("cy", function(d){return d.yy})
			.attr("r", 40)

	// navigational buttons
	d3.select("#forth")
		.on("click", function(){
			if (win!=last_win){
				win+=1
			}
		update_words()
		
		console.log(win)
		});

	d3.select("#back")
		.on("click", function(){
			if (win!=0){
				win-=1
			}
		update_words()

		console.log(win)
		});


	var force = d3.layout.force()
		.nodes(words_alive)
		.size([dimensions.width, dimensions.height])
		// .links([])
		.gravity(0)
		.charge(0) // ezt még haszon lehet
		.friction(.9) // .9 volt
		.on("tick", tick)
		.start();

	word_dots = chart_disp.selectAll("circle.word")
		.data(words_alive)
	  	.enter()
	  	.append("circle")
		  	.attr("class","word")
            .attr("cx", function(d){return d.x})
            .attr("cy", function(d){return d.y})
			.attr("r", 5) // az x és y koordináták a layout.force-ból jönnek!
			.attr("id", function(d){return d.name})
			.attr("fill", function(d){return d.color})
			.call(force.drag);

	// pulse for selected words!			
	//var selected = d3.selectAll("circle.word")
		// links at JS&stuff
		// lehessen klikkre kijelölni adjunk hozzá pulzálást, vagy legalább legyen először valami más színű!

	//doubleklick-re vegye fel a szót a selected list-re.
	// amikor a pulse()-t meghívjuk, gombnyomás vagy on/off és magát..., akkor a selected words koordinátáin
	// adjunk új circle-öket az svg-hez, és transit:r++ & fade. csá. 


//----------------------------------------

	function birth(word){
		var i = words_dead.indexOf(word)
		words_dead.splice(i,1)
		words_alive.push(word)

		

		word_dots.data(words_alive).enter()
		.append("circle")
		  	.attr("class","word")
            .attr("cx", function(d){return d.x})
            .attr("cy", function(d){return d.y})
			.attr("r", function(d){return d.r}) // az x és y koordináták a layout.force-ból jönnek!
			.attr("id", function(d){return d.name})
			.attr("fill", function(d){return d.color})
			.call(force.drag);

		force.nodes(words_alive).start();

	};


	function death(){}



	function tick(e) {
		console.log("tick!")
		var k = 0.04 * e.alpha;

		// Push nodes toward their designated focus.
		words_alive.forEach(function(o, i) {
			if (i === 3){
				console.log(o)
			}

			//o.color = color(curr_act);
			o.y += (clusters[o.cluster].yy - o.y) * k; // itt updateli a focinak megfelelően!
			o.x += (clusters[o.cluster].xx - o.x) * k;	// akkor nem tudom mi történik a timerben cx-szel, de mindegy is.
		});


		word_dots
			  .each(collide(.5))
			  /*.style("fill", function(d) { return d.color; })*/
		  .attr("cx", function(d) {console.log(d.name); return d.x; })
		  .attr("cy", function(d) { return d.y; });
		}


	// Resolve collisions between nodes.
	function collide(alpha) {					// alpha is a coolig parameter. 
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
	//----------------------------------------

}; // end of draw



// TODO
	// create fake word data, by clicks for now. later we invent json data. - done for now.
	// make word object find their clusters (mbostock collide funtion! <3)	- done!

	// some of the words wont appear. debug! - done
	// clean up code a little bit 			 - done, kinda

	// multiple words take the same place, debug! - done

	// add more word_dots 		   - done. for now
	// add random colors, for fun  - done
	
	// add more complex word objects - done
	// create chedules for them  - done 
	// connect update function to buttons - done
	// ----------------------------------

	
	// add word birth and death:
			// ellenőrizni kell, hogy ki él és ki nem,
				// aki meghalt, annak kell egy death_transit function
				// aki születik, akkak meg egy birth_stransit.



// 600.000+ szó, az lehet, hogy para, de akkor hogy lesz kisebb az adat?
	// a clusterek kréméjét fogjuk megjeleníteni...


// later but super important!
	// lehessen gombbal és autoplay-jel is haladni az időben
	// legyen érthető, szép idősáv, amin követhető, hogy hol tartunk
	// legyenek meg az időben széthúzott hisztogrammok (milyen jellemzők?)
	

	// lehessen kiválasztani egyes szavakat
		// pulzáljon szépen (elhaló koncentrikus körök vagy ilyesmi) 
			//(lehessen közben kijelölni újakat követésre, kattintással, és oldalt legyen nekik hely, ahol összefolalja az infókat róla!)
			// esetleg legyen egy path/history function, ami behúz egy vonalat akorbban látogatott clusterek között!
		// az lenne valószínűleg ideális, ha csak azok a clusterek jelennének meg, amikben valaha előfordul
		// a kiválasztott szavak valamelyike



// ---------------------------------------------
//a cluster birth és death nagyon egyszerű lesz:
	// birthnél new focus is created
	// deathnél először a szavak megkapják az új helyüket, aztán a halott focit kivesszük.
		// ilyenkor majd újrarendezzük a maradék focit. (az még kérdés, hogy mennyire lesz dinamikus a helyük, de aszerint)









