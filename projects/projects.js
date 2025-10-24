import { fetchJSON, renderProjects } from "../global.js";

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