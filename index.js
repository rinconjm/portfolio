import { fetchJSON, renderProjects, fetchGithubData} from './global.js';

// Load project data and filter first three projects
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0,3)

const projectsContainer = document.querySelector('.projects');

if (!projectsContainer) {
    console.error('No .projects container found');
} else {
    renderProjects(latestProjects, projectsContainer, 'h2');
}

const githubData = await fetchGithubData('rinconjm');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}