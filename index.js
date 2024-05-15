import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// hello_world()
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
    console.log(participants_scores)
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

function hello_world() {
    // Declare the chart dimensions and margins.
    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;

    // Declare the x (horizontal position) scale.
    const x = d3.scaleUtc()
        .domain([new Date("2023-01-01"), new Date("2024-01-01")])
        .range([marginLeft, width - marginRight]);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height - marginBottom, marginTop]);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height);

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    // Add the y-axis.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    // Append the SVG element.
    container.append(svg.node());
}
