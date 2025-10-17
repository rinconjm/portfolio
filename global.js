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
: "rinconjm.github.io/portfolio/"; //Github pages repo

let pages = [
    {url: '', title: 'Home'},
    {url: 'projects/', title: 'Projects'},
    {url: 'resume/', title: 'Resume'},
    {url: 'contact/', title: 'Contact'},
    {url: 'https://github.com/rinconjm', title: 'Github Profile'},
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = !p.url.startsWith('http') ? BASE_PATH + p.url : p.url;
    let title = p.title;
    
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    if (a.host !== location.host && a.pathname !== location.pathname) {
        a.target="_blank";
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

form?.addEventListener('submit', function(event) {
    event.preventDefault();

    const data = new FormData(form);
    const url = new URLSearchParams(form.action);

    for (let [name, value] of data) {
        url = url + "?" + name + "=" + value;
        console.log(name, value);
    }
    location.href = url;
});
