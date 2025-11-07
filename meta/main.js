import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Read CSV file
async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.Date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    return data;
}

// Computing commit data
function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/rinconjm/portfolio/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                writable: true,
                enumerable: true,
                configurable: true,
            });

            return ret;
        });
}

// Display the stats
function renderCommitInfo(data, commits) {
    // create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    const stats = [
        { label: 'Total <abbr title="Lines of code">LOC</abbr>', value: data.length },
        { label: 'Commits', value: commits.length },
        { label: 'Files', value: d3.groups(data, d => d.file).length },
        { label: 'Max Depth', value: d3.max(data, d => d.depth) },
        { label: 'Days Worked', value: new Set(commits.map(d => d.date)).size},
        { label: 'Max Lines', value: d3.max(commits, c => c.totalLines) },
    ];

    stats.forEach(({ label, value }) => {
        const block = dl.append('div').attr('class', 'stat-block');
        block.append('dt').html(label);
        block.append('dd').text(value);
    });
}

// Drawing plots
function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice(d3.timeDay);

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([height, 0]);

    // Create space for axes
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        witdh: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);


    // Create the grid lines and color
    const gridColor = d3.scaleThreshold()
        .domain([6, 19]) // <6 → night, 6–18 → day, >18 → night
        .range([
            'oklch(55% 0.12 240)', // night blue
            'oklch(85% 0.20 55)',  // day orange
            'oklch(55% 0.12 240)'  // night blue again
        ]);

    const gridlines = svg.append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    gridlines.call(
        d3.axisLeft(yScale)
            .tickFormat('')
            .tickSize(-usableArea.witdh)
    );

    gridlines.selectAll('line')
        .attr('stroke', (d) => gridColor(d))
        .attr('stroke-width', 1)
        .attr('vector-effect', 'non-scaling-stroke');;

    // (optional) mute the domain axis line in the grid group
    gridlines.select('.domain').attr('stroke', 'none');

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    createBrushSelector(svg);

    // Add dots
    const dots = svg
        .append('g')
        .attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines)
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([3, 20]);

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'oklch(0.4029 0.0913 247.35)')
        .style('fill-opacity', '0.6')
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', '1');
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event)
        })
        .on('mouseleave', () => {
            d3.select(event.currentTarget).style('fill-opacity', '0.6');
            updateTooltipVisibility(false);
        });
}

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author')
    const lines = document.getElementById('commit-lines')


    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });
    time.textContent = commit.time;
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;

}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
    svg
        .call(d3.brush().on('start brush end', brushed));

    svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d));

    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
    if (!selection) {
        return false;
    }
    const [x0, x1] = selection.map((d) => d[0]);
    const [y0, y1] = selection.map((d) => d[1]);

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'} commits selected`;
    
    return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

let data = await loadData();
let commits = processCommits(data);

let xScale, yScale;

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);