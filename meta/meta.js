
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';
import { commits, data, updateScatterPlot } from './main.js';


let commitProgress = 100;

let timeScale = d3
    .scaleTime()
    .domain([
        d3.min(commits, (d) => d.datetime),
        d3.max(commits, (d) => d.datetime)
    ])
    .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

const commitSlider = document.getElementById("commit-progress");
let timeElement = document.getElementById("commit-time");

let filteredCommits = commits;

let colors = d3.scaleOrdinal(d3.schemeTableau10);

function applyCommitCutoff(maxTime) {
    commitMaxTime = maxTime;
    timeElement.textContent = commitMaxTime.toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short"
    });

    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

    // ✅ both visualizations respond to the same state
    updateScatterPlot(data, filteredCommits);
    updateFileDisplay(filteredCommits);
}

// slider handler just turns slider value into a Date
export function onTimeSliderChange() {
    commitProgress = commitSlider.value;
    const maxTime = timeScale.invert(commitProgress);
    applyCommitCutoff(maxTime);
}

function updateFileDisplay(filteredCommits) {
  // 1. Capture old positions of file rows (keyed by file name)
  const oldPositions = new Map();
  d3.select('#files')
    .selectAll('div')
    .each(function (d) {
      if (!d) return;                      // first run: no data yet
      const key = d.name;
      const rect = this.getBoundingClientRect();
      oldPositions.set(key, rect);
    });

  // 2. Compute files from filtered commits
  const lines = filteredCommits.flatMap(d => d.lines);
  const files = d3
    .groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  // 3. Bind files to rows
  const rows = d3
    .select('#files')
    .selectAll('div')
    .data(files, d => d.name)            // key by file name
    .join(enter =>
      enter.append('div').call(div => {
        div.append('dt');
        div.append('dd');
      }),
    )
    .style('--color', d => colors(d.name));

  // 4. dt: filename + line count
  rows
    .select('dt')
    .html(d => `
      <code>${d.name}</code>
      <small>${d.lines.length} lines</small>
    `);

  // 5. dd: dots (no FLIP needed here, they move with the row)
  rows
    .select('dd')
    .selectAll('div.loc')
    .data(d => d.lines, d => `${d.file}:${d.line}`)
    .join(
      enter =>
        enter
          .append('div')
          .attr('class', 'loc')
          .style('opacity', 0)
          .transition()
          .duration(250)
          .style('opacity', 1),
      update => update,
      exit =>
        exit
          .transition()
          .duration(250)
          .style('opacity', 0)
          .remove(),
    )
    .style('--color', d => colors(d.type || d.file));

  // 6. FLIP: animate rows from old → new position
  rows.each(function (d, i) {
    const key = d.name;
    const old = oldPositions.get(key);
    if (!old) return;                    // new row, no old position

    const newRect = this.getBoundingClientRect();
    const dx = old.left - newRect.left;
    const dy = old.top - newRect.top;

    console.log(d.name, dx, dy);

    // optional stagger
    this.style.setProperty('--delay', `${i * 80}ms`);

    // invert
    this.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => {
    this.style.transform = 'translate(0, 0)';
    });

    // force reflow
    this.offsetWidth;

    // play
    this.style.transform = 'translate(0, 0)';
  });
}


d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(
        (d, i) => `
		<p>On ${d.datetime.toLocaleString('en', {
            dateStyle: 'full',
            timeStyle: 'short',
        })},
		I made <a href="${d.url}" target="_blank">${i > 0 ? 'another commit' : 'my first commit, and it was glorious'
            }</a>.
		I edited ${d.totalLines} lines across ${d3.rollups(
                d.lines,
                (D) => D.length,
                (d) => d.file,
            ).length
            } files.
		Then I looked over all I had made, and I saw that it was very good.</p>
	`,
    );

d3.select('#files-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(d => {
        const dateStr = d.datetime.toLocaleString('en', {
            dateStyle: 'full',
            timeStyle: 'short',
        });

        const filesRollup = d3.rollups(
            d.lines,
            D => D.length,
            x => x.file,
        );
        const fileCount = filesRollup.length;
        const [largestFile, largestLines] = filesRollup
            .sort((a, b) => b[1] - a[1])[0];

        return `
      <p>On ${dateStr}, I edited <strong>${d.totalLines}</strong> lines across
      <strong>${fileCount}</strong> files.
      The largest file was <code>${largestFile}</code> with ${largestLines} lines touched.</p>
    `;
    });

function onScatterStepEnter(response) {
    const commit = response.element.__data__;
    const maxTime = commit.datetime;
    const filteredCommits = commits.filter(d => d.datetime <= maxTime);

    updateScatterPlot(data, filteredCommits);   // only scatter here
}

const scatterScroller = scrollama();
scatterScroller
    .setup({
        container: '#scrolly-1',
        step: '#scatter-story .step',
        offset: 0.6,
    })
    .onStepEnter(onScatterStepEnter);

function applyFilesForCommit(commit) {
    // cumulative up to this commit (same logic you used for slider)
    const maxTime = commit.datetime;
    const filteredCommits = commits.filter(d => d.datetime <= maxTime);

    updateFileDisplay(filteredCommits);      // dots + left list
    // if you also want the scatter plot to follow:
    // updateScatterPlot(data, filteredCommits);
}

function onFilesStepEnter(response) {
    const commit = response.element.__data__;
    applyFilesForCommit(commit);
}

const filesScroller = scrollama();
filesScroller
    .setup({
        container: '#scrolly-files',
        step: '#files-story .step',
        offset: 0.6,
    })
    .onStepEnter(onFilesStepEnter);

