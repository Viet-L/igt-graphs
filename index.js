import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

main()
const GROUP_AMOUNT = 20

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
    var participants_proportion = Array.from(Array(6), () => [])
    var participants_proportion_group = Array.from(Array(6), () => [])
    for(let id = 1; id <= 6; id++) {
        participants_scores[id - 1] = get_score_proportion(participants_days[id - 1])
        participants_proportion[id - 1] = get_choice_proportion(participants_days[id - 1])
        participants_proportion_group[id - 1] = get_choice_proportion_group(participants_days[id - 1])
    }
    draw_tool_tip()
    for(let id = 1; id <= 6; id++) {
        draw_total_score(participants_scores[id - 1], id)
        draw_total_proportion(participants_proportion[id - 1], id)
        draw_group_proportion(participants_proportion_group[id - 1], id)
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

//expect a participant with 14 days + GAV
function get_choice_proportion(participant) {
    var choice = Array.from(Array(15), () => [])
    for(let i = 0; i < choice.length; i++) {
        if(participant[i].length === 0) {
            choice[i] = undefined
            continue;
        }
        let curr = [0, 0, 0, 0]
        let curr_day = participant[i]
        curr_day.map((item) => {
            // if card draw is 0/1 or A/B, then it is negative
            let value = item.card
            curr[Math.floor(value)]++
        })
        curr.forEach((val, j) => {
            curr[j] = val/participant[i].length
        })
        choice[i] = curr
    }
    return choice
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

//expect a participant with 14 days + GAV
function get_choice_proportion_group(participant) {
    var choice = Array.from(Array(15), () => [])
    for(let i = 0; i < choice.length; i++) {
        if(participant[i].length === 0) {
            choice[i] = undefined
            continue;
        }
        let curr_day = participant[i]
        for(let block = 0; block <= curr_day.length/GROUP_AMOUNT; block++) {
            let end = Math.min((block + 1) * GROUP_AMOUNT, curr_day.length)
            let curr_block_i = block * GROUP_AMOUNT
            if(curr_block_i == end) continue
            let curr = {
                value: [0, 0, 0, 0],
                count: 0
            }
            for(let curr_block_i = block * GROUP_AMOUNT; curr_block_i < end; curr_block_i++) {
                curr.value[Math.floor(curr_day[curr_block_i].card)]++
                curr.count++
            }
            curr.value.forEach((val, j) => {
                curr.value[j] = val/curr.count
            })
            
            choice[i].push(curr)
        }
    }
    return choice
}

function draw_tool_tip() {
    // Append tooltip div to the document body
    d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background-color", "lightgrey")
        .style("margin", "5px")
        .style("padding", "3px"); // Customize the fill color of the circles
}


function draw_total_score(participant, id) {
    // Convert original data to new format
    function convertData(originalData) {
        const convertedData = [];
        originalData.forEach((value, index) => {
            if(value != undefined) {
                convertedData.push({
                    x: index, // Adjust x values as needed
                    y: value, // Adjust y values as needed
                    
                });
            }
        });
        return convertedData;
    }

    // Convert original data to new format
    const data = convertData(participant);
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

     // Create curved lines between circles
    const line = d3.line()
        .x((d, i) => x(d.x))
        .y(d => y(d.y));
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

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
            tooltip.style("opacity", .9) // Make the tooltip visible
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

function draw_total_proportion(participant, id) {
    // Convert original data to new format
    function convertData(originalData) {
        const convertedData = [];
        originalData.forEach((arr, index) => {
            if(arr != undefined) {
                arr.forEach((value, groupIndex) => {
                    convertedData.push({
                        x: index, // Adjust x values as needed
                        y: value, // Adjust y values as needed
                        group: groupIndex + 1
                    });
                });
            }
        });
        return convertedData;
    }

    // Convert original data to new format
    const data = convertData(participant);
    var z = d3.scaleOrdinal()
    .range(["steelblue", "green", "pink", "orange"]);

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
        .domain([0, 1])
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

    // Create lines between points of the same group
    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));
        // .curve(d3.curveCardinal.tension(1));

    for (let i = 1; i <= 4; i++) {
        const groupData = data.filter(d => d.group === i);
        svg.append("path")
            .datum(groupData)
            .attr("fill", "none")
            .attr("stroke", z(i))
            .attr("stroke-width", 2)
            .attr("d", line)
            .attr("fill-opacity", 0.5);
    }
    const group_map = {1: "A", 2: "B", 3: "C", 4: "D"}
    // Create circles for each participant
    svg.selectAll("circle")
        .data(data.map((d, i) => ({value: d.y, index: d.x, group: d.group})))
        .enter()
        .filter(d => d.value !== undefined) // Filter out undefined data points
        .append("circle")
        .attr("cx", d => x(d.index)) // Use index i as x-coordinate
        .attr("cy", d => y(d.value)) // Use participant value as y-coordinate
        .attr("r", 5) // Adjust the radius of the circles as needed
        .attr("fill", d => z(d.group))
        .attr("fill-opacity", 0.8)
        .on("mouseover", function(d, data) { // Add mouseover event handler
            const tooltip = d3.select("#tooltip"); // Select the tooltip div
            
            const deck = group_map[data.group]
            tooltip.style("opacity", .9) // Make the tooltip visible
                .html(`Day ${data.index} Deck ${deck} with Value: ${data.value.toFixed(2)}`) // Set the content of the tooltip to be the value of the data point
                .style("left", (d.pageX) + "px") // Position the tooltip next to the mouse cursor
                .style("top", (d.pageY - 20) + "px")
                .style("z-index", 1);
        })
        .on("mouseout", function() { // Add mouseout event handler
            d3.select("#tooltip").style("opacity", 0).style("z-index", -1); // Hide the tooltip
        });

    var legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
      .selectAll("g")
      .data(["A", "B", "C", "D"].slice())
      .enter().append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  
    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);
  
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function(d) { return d; });

    // Append title to the graph
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", marginTop / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text(`Participant ${id} Deck Proportion`);

    container2.append(svg.node());
}

function draw_group_proportion(participant, id) {

    // Convert original data to new format
    function convertData(originalData) {
        const convertedData = [];
        originalData.forEach((arr, day) => {
            let dayData = undefined
            if(arr != undefined) {
                dayData = []
                arr.forEach((block, index) => {
                    let blockData = []
                    if(block != undefined) {
                        block.value.forEach((value, groupIndex) => {
                            dayData.push({
                                x: index, // Adjust x values as needed
                                y: value, // Adjust y values as needed
                                group: groupIndex + 1,
                            });
                        })
                    }
                    // dayData.push(blockData)
                });
            }
            convertedData.push(dayData)
        });
        return convertedData;
    }
    // Convert original data to new format
    const data = convertData(participant);
    for(let i = 0; i < 15; i++) {
        draw_day_proportion(data[i], id, i)
    }
}

function draw_day_proportion(data, id, day) {
    if(data === undefined) {
        data = []
    }
    const width = window.innerHeight / 2;
    const height = 400;
    const marginTop = 40;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;
    const block_count = Math.max(Math.ceil(data.length/4) - 1, 0)
    const x = d3.scaleLinear()
        .domain([0, block_count])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height - marginBottom, marginTop]);
    
    var z = d3.scaleOrdinal()
        .range(["steelblue", "green", "pink", "orange"]);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(block_count))

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    // Create lines between points of the same group
    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));
        // .curve(d3.curveCardinal.tension(1));

    for (let i = 1; i <= 4; i++) {
        const groupData = data.filter(d => d.group === i);
        svg.append("path")
            .datum(groupData)
            .attr("fill", "none")
            .attr("stroke", z(i))
            .attr("stroke-width", 2)
            .attr("d", line)
            .attr("fill-opacity", 0.5);
    }
    const group_map = {1: "A", 2: "B", 3: "C", 4: "D"}
    // Create circles for each participant
    svg.selectAll("circle")
        .data(data.map((d, i) => ({value: d.y, index: d.x, group: d.group})))
        .enter()
        .filter(d => d.value !== undefined) // Filter out undefined data points
        .append("circle")
        .attr("cx", d => x(d.index)) // Use index i as x-coordinate
        .attr("cy", d => y(d.value)) // Use participant value as y-coordinate
        .attr("r", 5) // Adjust the radius of the circles as needed
        .attr("fill", d => z(d.group))
        .attr("fill-opacity", 0.8)
        .on("mouseover", function(d, data) { // Add mouseover event handler
            const tooltip = d3.select("#tooltip"); // Select the tooltip div
            
            const deck = group_map[data.group]
            tooltip.style("opacity", .9) // Make the tooltip visible
                .html(`Day ${data.index} Deck ${deck} with Value: ${data.value.toFixed(2)}`) // Set the content of the tooltip to be the value of the data point
                .style("left", (d.pageX) + "px") // Position the tooltip next to the mouse cursor
                .style("top", (d.pageY - 20) + "px")
                .style("z-index", 1);
        })
        .on("mouseout", function() { // Add mouseout event handler
            d3.select("#tooltip").style("opacity", 0).style("z-index", -1); // Hide the tooltip
        });

    var legend = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
      .selectAll("g")
      .data(["A", "B", "C", "D"].slice())
      .enter().append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  
    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);
  
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function(d) { return d; });

    // Append title to the graph
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", marginTop / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text(`Participant ${id} Day ${day} Deck Proportion`);
    switch(id) {
        case 1:
            container_pro_1.append(svg.node());
            break
        case 2:
            container_pro_2.append(svg.node());
            break
        case 3:
            container_pro_3.append(svg.node());
            break
        case 4:
            container_pro_4.append(svg.node());
            break
        case 5:
            container_pro_5.append(svg.node());
            break
        case 6:
            container_pro_6.append(svg.node());
            break
        default:
            console.error("Wrong ID", id)
    }
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