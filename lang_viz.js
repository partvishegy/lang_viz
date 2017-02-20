var win;

// define place of fixed clusters.name: 1,
var clusters = [
	{name: 1, xx:150, yy:280},
	{name: 1, xx:360, yy:120},
	{name: 1, xx:570, yy:280}
	]

function draw(data) {
	"use strict"
	console.log("running!")
	console.log(data)//.xx.length

	var last_win = data[data.length-1].birth + data[data.length-1].xx.length -1

	var container_dimensions = {width: 900, height: 400},
		margins = {top: 10, right: 20, bottom: 30, left: 60},
		chart_dimensions = {
		width: container_dimensions.width - margins.left - margins.right,
		height: container_dimensions.height - margins.top - margins.bottom};



	var chart_disp = d3.select("#chart_disp")//.style("border", "dashed black")
		.append("svg")
			.attr("width", container_dimensions.width)
			.attr("height", container_dimensions.height);

/*	var hist = d3.select("#hist_disp")
		.append("div")
			.style("width", container_dimensions.widht)
			.style("height", "200px")
			.style("border", "solid red");*/

	win = 0; /*when klicking on the back or forth button this value will change.*/
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


	chart_disp.selectAll("circle")
		.data(clusters)
		.enter()
		.append("circle")
			.attr("class", "cluster")
			.attr("cx", function(d){return d.xx})
			.attr("cy", function(d){return d.yy})
			.attr("r", 120)

	// reading data... we dont need it yet, but words will come in here. (creating objects WITH SCHEDULES!!!)
/*	chart_disp.selectAll("circle")
		.data(data)
		.enter()
		.append("circle")

		update_frame()*/


	// navigational buttons
	d3.selectAll("#forth")
		.on("click", function(){
			if (win!=last_win){
				win+=1
			}
		update_frame()
		
		console.log(win)
		});

	d3.selectAll("#back")
		.on("click", function(){
			if (win!=0){
				win-=1
			}
		update_frame()

		console.log(win)
		});

}; // end of draw




















