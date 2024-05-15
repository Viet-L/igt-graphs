import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

main()

async function main() {
    var participants = await load_participants()
    var participants_days = Array.from(Array(6), () => [])
    participants_days.forEach((participant) => {
        for(let i = 0; i <= 14; i++) {
            participant.push([])
        }
    })
    fill_participants_days(participants, participants_days)
    var participants_scores = Array.from(Array(6), () => [])
    for(let id = 1; id <= 6; id++) {
        participants_scores[id - 1] = get_score_proportion(participants_days[id - 1])
    }
    draw_tool_tip()
    for(let id = 1; id <= 6; id++) {
        draw_total_score(participants_scores[id - 1], id)
    }

}

async function load_participants() {
    var participants = []
    for(let i = 1; i <= 6; i++) {
        let curr_participant = await read_participant(i)
        participants.push(curr_participant)
    }
    return participants
}

function fill_participants_days(participants, participants_days) {
    for(let i = 1; i <= 6; i++) {
        let curr_participant = participants[i - 1]
        curr_participant.map((item) => {
            let curr_day = item.day
            participants_days[i - 1][curr_day].push(item)
        })
    }
}

//expect a participant with 14 days + GAV
function get_score_proportion(participant) {
    var score = new Array(15).fill(0)
    for(let i = 0; i < score.length; i++) {
        if(participant[i].length === 0) {
            score[i] = undefined
            continue;
        }
        let curr_score = 0;
        let curr_day = participant[i]
        curr_day.map((item) => {
            // if card draw is 0/1 or A/B, then it is negative
            let value = item.card <= 1 ? -1 : 1
            curr_score += value
        })
        curr_score /= participant[i].length
        score[i] = curr_score
    }
    return score
}

async function read_participant(id) {
    var file = "data/participant_" + id + ".csv"
    var value = await d3.csv(file, (data) => {
        return {
            rt: data.Deck_RT,
            day: data.day,
            card: data.response,
            total: data.totalsum
        }
    })
    return value
}

function draw_tool_tip() {
    // Append tooltip div to the document body
    d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background-color", "lightgrey")
        .style("margin", "5px"); // Customize the fill color of the circles
}


function draw_total_score(participant, id) {
    const width = window.innerHeight / 2;
    const height = 400;
    const marginTop = 40;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;

    const x = d3.scaleLinear()
        .domain([0, 14])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([-1, 1])
        .range([height - marginBottom, marginTop]);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(14))

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    // Append guideline at y = 0
    svg.append("line")
        .attr("x1", marginLeft)
        .attr("y1", y(0))
        .attr("x2", width - marginRight)
        .attr("y2", y(0))
        .attr("stroke", "red")
        .attr("stroke-dasharray", "4"); // Optional: add dashed line style

    // Create circles for each participant
    svg.selectAll("circle")
        .data(participant.map((d, i) => ({value: d, index: i})))
        .enter()
        .filter(d => d.value !== undefined) // Filter out undefined data points
        .append("circle")
        .attr("cx", d => x(d.index)) // Use index i as x-coordinate
        .attr("cy", d => y(d.value)) // Use participant value as y-coordinate
        .attr("r", 5) // Adjust the radius of the circles as needed
        .attr("fill", "steelblue")
        .on("mouseover", function(d, data) { // Add mouseover event handler
            const tooltip = d3.select("#tooltip"); // Select the tooltip div
            tooltip.style("opacity", 1) // Make the tooltip visible
                .html(`Day ${data.index} with Value: ${data.value.toFixed(2)}`) // Set the content of the tooltip to be the value of the data point
                .style("left", (d.pageX) + "px") // Position the tooltip next to the mouse cursor
                .style("top", (d.pageY - 20) + "px")
                .style("z-index", 1);
        })
        .on("mouseout", function() { // Add mouseout event handler
            d3.select("#tooltip").style("opacity", 0).style("z-index", -1); // Hide the tooltip
        });
    
    // Append title to the graph
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", marginTop / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text(`Participant ${id} Score`);
    
    container.append(svg.node());

}

var acc = document.getElementsByClassName("accordion");

for (let i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });
}