import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsTitle = document.querySelector('.projects-title');
if(projectsTitle && Array.isArray(projects)) {
    projectsTitle.textContent= `${projects.length} Projects`
}

//Select container to render project articles
const projectsContainer = document.querySelector('.projects');
if (!projectsContainer) {
    console.error('No .projects container found');
} else {
    renderProjects(projects, projectsContainer, 'h2');
}

// Set overall size of pie chart
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

function renderPieChart(projectsGiven) {
    //reset svg and legend before rendering
    let svg = d3.select('svg');
    svg.selectAll('path').remove();

    let legend = d3.select('.legend');
    legend.selectAll('*').remove();

    // Re-calculate rolled data
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    // Re-calculate Data
    let newData = newRolledData.map(([year, count]) => {
        return {value:count, label:year}
    });

    window.newData = newData;

    // Re-calculate slice generator, arc data, etc
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    // Clear up paths and legends
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let selectedIndex = -1;
    svg.selectAll('path').remove();

    newArcs.forEach((arc, idx) => {
        svg
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(idx))
        .on('click', () => {
            selectedIndex = selectedIndex === idx ? -1 : idx;

            svg
            .selectAll('path')
            .attr('class', (_, i) => (
                // TODO: filter idx to find correct pie slice and apply CSS from above
                i === selectedIndex? 'slice selected': 'slice' ));

            legend 
            .selectAll('li .swatch')
            .attr('class', (_, i) => (
                i === selectedIndex? 'swatch selected': 'swatch'
            ));

            if (selectedIndex === -1) {
                renderProjects(projects, projectsContainer, 'h2')
            } else {
                const selectedYear = newData[selectedIndex].label;
                // const filteredProjects = projects.filter(p => String(p.year) === String(selectedYear));
                const filteredProjects = projects.filter(project => {
                    const values = Object.values(project).join('\n').toLowerCase();
                    return values.includes(String(newData[selectedIndex].label).toLowerCase());
                });
                renderProjects(filteredProjects, projectsContainer, 'h2');
            }

        });
    });

    newData.forEach((d, idx) => {
        legend
        .append('li')
        .attr('style', `--color:${colors(idx)}`) 
        .attr('class', 'legend-item')
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

// Call function on page load
renderPieChart(projects);

// Create search field
let query = '';
let selectedIndex = -1;
let newData = [];

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    // update every query value
    query = event.target.value;

    // get selected year if a slice is selected
    const selectedYear = selectedIndex !== -1 ? newData[selectedIndex].label : null;

    // filter the projects
    let filteredProjects = projects.filter((project) => { 
        let values = Object.values(project).join('\n').toLowerCase(); 
        const matchesQuery = values.includes(query);
        const matchesYear = selectedYear ? String(project.year) === String(selectedYear) : true;
        return matchesQuery && matchesYear;
    });

    // render the updated projects
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});