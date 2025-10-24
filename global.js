console.log('IT’S ALIVE!');

//Add Current status to nav link
function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

const navLinks = $$('nav a');

let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname,
);

if (currentLink) {
    // or if (currentLink !== undefined)
    currentLink?.classList.add('current');
}

// Add a new navigation menu 
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/portfolio/"           //local server
    : "/portfolio/";          //Github pages repo

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/rinconjm', title: 'Github Profile' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    //Checks if url is relative
    //if not, prefix with base path
    let url = !p.url.startsWith('http') ? BASE_PATH + p.url : p.url;
    let title = p.title;

    //Create a new anchor tag
    let a = document.createElement('a');
    //sets the href attribute of the anchor
    a.href = url;
    //sets the visible text for the nav bar
    a.textContent = title;
    //append to nav bar
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    if (a.host !== location.host && a.pathname !== location.pathname) {
        a.target = "_blank";
    }
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
		</select>
	</label>
    `,
);

const select = document.querySelector('.color-scheme select');

if ("colorScheme" in localStorage) {
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}

select.addEventListener('input', function (event) {
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;
    console.log('color scheme changed to', event.target.value);
});

const form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
    event.preventDefault();

    const data = new FormData(form);
    const url = new URLSearchParams(form.action);

    for (let [name, value] of data) {
        url = url + "?" + name + "=" + value;
        console.log(name, value);
    }
    location.href = url;
});

export async function fetchJSON(url) {
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    // Ensure containerElement is a valid DOM element
    if (!(containerElement instanceof HTMLElement)) {
        console.error('renderProjects: containerElement is not a valid DOM element');
        return;
    }
    containerElement.innerHTML = '';

    // Handle missing project data
    if (!Array.isArray(projects) || projects.length==0) {
        const placeholder = document.createElement('p');
        placeholder.className('no-projects');
        placeholder.textContent('No projects available at this moment');
        containerElement.appendChild(placeholder);
        return;
    }

    // Render all project articles
    projects.forEach(project => {
        const article = document.createElement('article');

        article.innerHTML = `
            <h3>${project.title}</h3>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
        `;

        containerElement.appendChild(article);
    })
}

export async function fetchGithubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
