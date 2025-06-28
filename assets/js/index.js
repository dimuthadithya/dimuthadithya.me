// Initialize ScrollReveal
ScrollReveal().reveal('.card', {
  delay: 200,
  distance: '20px',
  origin: 'bottom',
  opacity: 0,
  duration: 1000,
  easing: 'cubic-bezier(0.5, 0, 0, 1)'
});

// Additional ScrollReveal for skills items
ScrollReveal().reveal('.skills-item', {
  delay: 200,
  distance: '20px',
  origin: 'left',
  opacity: 0,
  duration: 800,
  interval: 100
});

// GitHub Data Integration
async function fetchGitHubData() {
  try {
    // Fetch cached GitHub data
    const response = await fetch('./data/github-data.json');
    const data = await response.json();

    const { profile: userData, repos: allReposData, stats } = data;

    // Update profile section
    if (document.getElementById('profile-image')) {
      document.getElementById('profile-image').src = userData.avatar_url;
    }
    if (document.getElementById('github-bio')) {
      document.getElementById('github-bio').textContent = userData.bio || '';
    }
    if (document.getElementById('github-repos')) {
      document.getElementById('github-repos').textContent = stats.totalRepos;
    }
    if (document.getElementById('github-followers')) {
      document.getElementById('github-followers').textContent =
        userData.followers;
    }

    // Add stats if container exists
    const statsContainer = document.querySelector('.github-stats');
    if (statsContainer) {
      statsContainer.innerHTML += `
        <div>
          <div class="text-2xl font-bold gradient-text">${stats.totalStars}</div>
          <div class="text-gray-400">Total Stars</div>
        </div>
        <div>
          <div class="text-2xl font-bold gradient-text">
            PHP
            </div>
          <div class="text-gray-400">Top Language</div>
        </div>
      `;
    }

    // Store all projects globally and initialize filters
    allProjects = allReposData;
    const topics = collectTopics(allProjects);
    updateTopicFilters(topics);
    updateTopicCounts(allProjects);
    await renderProjects(allProjects);
  } catch (error) {
    console.error('Error loading GitHub data:', error);
    document.getElementById('github-projects').innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-circle text-4xl text-purple-500 mb-4"></i>
        <p class="text-gray-400">Unable to load GitHub projects. Please try again later.</p>
      </div>
    `;
  }
}

// Helper function to get the most used language
function getTopLanguage(repos) {
  const languageCounts = {};
  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });
  return Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Call the function when the page loads
window.addEventListener('load', fetchGitHubData);

// Initialize Typed.js for the typewriter effect
const typed = new Typed('#typewriter', {
  strings: ['Intern Software Engineer', 'Web Developer', 'UI/UX Designer'],
  typeSpeed: 50,
  backSpeed: 30,
  backDelay: 2000,
  startDelay: 500,
  loop: true
});

// Show subtitle (replacing GSAP animation with simple CSS)
document.getElementById('subtitle').style.opacity = 1;

// Project filtering functionality
let allProjects = [];
let currentSearchTerm = '';
let currentTopic = 'all';

function collectTopics(projects) {
  const topicsSet = new Set();
  projects.forEach((project) => {
    if (project.topics && project.topics.length > 0) {
      project.topics.forEach((topic) => topicsSet.add(topic));
    }
  });
  return Array.from(topicsSet).sort();
}

function updateTopicFilters(topics) {
  const topicFilters = document.getElementById('topic-filters');
  const existingButtons = Array.from(topicFilters.children);
  const allButton = existingButtons[0]; // Keep the "All Topics" button

  // Add click event listener to "All Topics" button
  allButton.addEventListener('click', () => filterByTopic('all'));

  // Remove old topic buttons
  existingButtons.slice(1).forEach((button) => button.remove());

  // Add new topic buttons
  topics.forEach((topic) => {
    const button = document.createElement('button');
    button.className =
      'px-4 py-2 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 transition-colors';
    button.setAttribute('data-topic', topic);
    button.innerHTML = `
      <span class="capitalize">${topic.replace(/-/g, ' ')}</span>
      <span class="ml-2 text-xs bg-purple-500/30 px-2 py-1 rounded-full" id="topic-count-${topic}">0</span>
    `;
    button.addEventListener('click', () => filterByTopic(topic));
    topicFilters.appendChild(button);
  });
}

function updateTopicCounts(projects) {
  const topics = collectTopics(projects);
  const topicCounts = {};

  // Count projects per topic
  projects.forEach((project) => {
    if (project.topics) {
      project.topics.forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
  });

  // Update count badges
  topics.forEach((topic) => {
    const countElement = document.getElementById(`topic-count-${topic}`);
    if (countElement) {
      countElement.textContent = topicCounts[topic] || 0;
    }
  });

  // Update "All Topics" count
  const allCountElement = document.querySelector('[data-topic="all"] .count');
  if (allCountElement) {
    allCountElement.textContent = allProjects.length;
  }
}

// Initialize the topic filters when page loads
document.addEventListener('DOMContentLoaded', () => {
  const allTopicsButton = document.querySelector('[data-topic="all"]');
  if (allTopicsButton) {
    allTopicsButton.addEventListener('click', () => filterByTopic('all'));
  }
});

function filterByTopic(topic) {
  currentTopic = topic;
  updateActiveTopicButton(topic);
  filterProjects(currentSearchTerm);
}

function updateActiveTopicButton(topic) {
  document.querySelectorAll('#topic-filters button').forEach((button) => {
    button.classList.remove('active', 'bg-purple-500', 'text-white');
    if (button.getAttribute('data-topic') === topic) {
      button.classList.add('active', 'bg-purple-500', 'text-white');
    }
  });
}

async function filterProjects(searchTerm) {
  currentSearchTerm = searchTerm;

  let filteredProjects = allProjects;

  // Apply search term filter
  if (searchTerm) {
    filteredProjects = filteredProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description &&
          project.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (project.language &&
          project.language.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.topics &&
          project.topics.some((topic) =>
            topic.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );
  }

  // Apply topic filter
  if (currentTopic !== 'all') {
    filteredProjects = filteredProjects.filter(
      (project) => project.topics && project.topics.includes(currentTopic)
    );
  }

  await renderProjects(filteredProjects);
}

// Remove this entire displayProjects function as we're using renderProjects instead
function oldDisplayProjects(projects) {
  const projectsContainer = document.getElementById('github-projects');

  if (projects.length === 0) {
    projectsContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-folder-open text-4xl text-purple-500 mb-4"></i>
        <p class="text-gray-400">No projects found matching your search.</p>
      </div>
    `;
    return;
  }

  projectsContainer.innerHTML = projects
    .map(
      (repo) => `
    <div class="card rounded-xl p-6 group">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <i class="fas fa-folder text-purple-500 text-2xl mr-3 group-hover:rotate-[-15deg] transition-transform"></i>
          <h3 class="text-xl font-bold">${repo.name}</h3>
        </div>
        ${
          repo.private
            ? '<span class="px-2 py-1 rounded bg-purple-500/20 text-purple-500 text-xs">Private</span>'
            : ''
        }
      </div>
      <p class="text-gray-400 mb-4 line-clamp-2">${
        repo.description || 'No description available'
      }</p>
      <div class="flex gap-3 mb-6 flex-wrap">
        ${
          repo.language
            ? `<span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-sm flex items-center">
            <i class="fas fa-code mr-1"></i>${repo.language}
          </span>`
            : ''
        }
        <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-sm flex items-center">
          <i class="fas fa-star mr-1"></i>${repo.stargazers_count} stars
        </span>
        <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-sm flex items-center">
          <i class="fas fa-code-branch mr-1"></i>${repo.forks_count} forks
        </span>
        <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-sm flex items-center">
          <i class="fas fa-eye mr-1"></i>${repo.watchers_count} watchers
        </span>
      </div>
      <div class="flex gap-3 mb-6 flex-wrap">
        <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-sm flex items-center">
          <i class="far fa-calendar-alt mr-1"></i>Created: ${new Date(
            repo.created_at
          ).toLocaleDateString()}
        </span>
        <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-sm flex items-center">
          <i class="fas fa-sync-alt mr-1"></i>Updated: ${new Date(
            repo.updated_at
          ).toLocaleDateString()}
        </span>
        ${
          repo.homepage
            ? `<span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-sm flex items-center">
            <i class="fas fa-globe mr-1"></i>Has Demo
          </span>`
            : ''
        }
      </div>
      ${
        repo.topics && repo.topics.length
          ? `<div class="flex gap-2 flex-wrap mb-6">
          ${repo.topics
            .map(
              (topic) =>
                `<span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-500 text-sm">#${topic}</span>`
            )
            .join('')}
        </div>`
          : ''
      }
      <div class="flex gap-3">
        <a href="${repo.html_url}" target="_blank" 
           class="inline-flex items-center px-4 py-2 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 transition-colors">
          <i class="fab fa-github mr-2"></i>View Source
          <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
        </a>
        ${
          repo.homepage
            ? `<a href="${repo.homepage}" target="_blank" 
             class="inline-flex items-center px-4 py-2 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 transition-colors">
            <i class="fas fa-external-link-alt mr-2"></i>Live Demo
          </a>`
            : ''
        }
      </div>
    </div>
  `
    )
    .join('');
}

// Load GitHub data
async function loadGitHubData() {
  try {
    const response = await fetch('./data/github-data.json');
    return await response.json();
  } catch (error) {
    console.error('Error loading GitHub data:', error);
    return null;
  }
}

// Function to handle image loading errors and provide fallback
function handleImageError(img, projectName) {
  img.onerror = null; // Prevent infinite loop
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    projectName
  )}&background=6d28d9&color=ffffff&size=200`;
}

// Render GitHub projects
async function renderProjects(projects, filter = 'all') {
  const container = document.getElementById('github-projects');
  container.innerHTML = '';

  const filteredProjects = projects.filter((project) => {
    if (filter === 'all') return true;
    return project.topics && project.topics.includes(filter);
  });

  // Create and append all cards first
  filteredProjects.forEach((project) => {
    const card = document.createElement('div');
    card.className = 'card rounded-xl p-6 hover:shadow-lg';

    const imageContainer = document.createElement('div');
    imageContainer.className =
      'relative h-48 mb-4 rounded-lg overflow-hidden bg-purple-500/20';

    if (project.cardImage) {
      const img = document.createElement('img');
      img.className = 'w-full h-full object-cover';
      img.alt = project.name;
      img.style.opacity = '1';
      img.style.transition = 'opacity 0.3s ease-in-out';
      // Set crossOrigin to allow loading from GitHub
      img.crossOrigin = 'anonymous';

      // Set image source immediately
      img.src = project.cardImage;
      img.onerror = () => handleImageError(img, project.name);
      img.onload = () => {
        setTimeout(() => {
          img.style.opacity = '1';
        }, 100);
      };

      imageContainer.appendChild(img);
    } else {
      imageContainer.innerHTML = `
        <div class="h-full w-full flex items-center justify-center">
          <i class="fas fa-code text-4xl text-purple-500/50"></i>
        </div>
      `;
    }

    card.innerHTML = `
      ${imageContainer.outerHTML}
      <h3 class="text-xl font-bold mb-2">${project.name}</h3>
      <p class="text-gray-300 mb-4 line-clamp-3">${
        project.description || ''
      }</p>
      <div class="flex flex-wrap gap-2 mb-4">
        ${(project.topics || [])
          .map(
            (topic) =>
              `<span class="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300">
              ${topic}
             </span>`
          )
          .join('')}
      </div>
      <div class="flex items-center justify-between text-sm text-gray-400">
        <div class="flex items-center space-x-4">
          <span><i class="fas fa-star mr-1"></i>${
            project.stargazers_count
          }</span>
          <span><i class="fas fa-code-fork mr-1"></i>${
            project.forks_count
          }</span>
        </div>
        <a href="${project.html_url}" target="_blank" rel="noopener noreferrer" 
           class="text-purple-400 hover:text-purple-300">
          <i class="fas fa-external-link-alt"></i>
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

// Initialize projects
async function initializeProjects() {
  const data = await loadGitHubData();
  if (!data) return;

  const projects = data.repos;
  const topics = [
    ...new Set(projects.flatMap((project) => project.topics || []))
  ];

  // Initialize topic filters
  const topicFilters = document.getElementById('topic-filters');
  topics.forEach((topic) => {
    const count = projects.filter(
      (p) => p.topics && p.topics.includes(topic)
    ).length;
    const button = document.createElement('button');
    button.className =
      'px-4 py-2 rounded-lg bg-purple-500/20 text-white hover:bg-purple-500/30 transition-colors';
    button.setAttribute('data-topic', topic);
    button.innerHTML = `
      ${topic}
      <span class="ml-2 text-xs bg-purple-500/30 px-2 py-1 rounded-full count">${count}</span>
    `;
    button.onclick = () => {
      document
        .querySelectorAll('#topic-filters button')
        .forEach((btn) => btn.classList.remove('bg-purple-500'));
      button.classList.add('bg-purple-500');
      renderProjects(projects, topic);
    };
    topicFilters.appendChild(button);
  });

  // Update "All Topics" count
  const allTopicsCount = document.querySelector('[data-topic="all"] .count');
  allTopicsCount.textContent = projects.length;

  // Initialize search
  const searchInput = document.getElementById('project-search');
  searchInput.addEventListener('input', (e) => {
    filterProjects(e.target.value);
  });

  // Initial render
  await renderProjects(projects);
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', initializeProjects);

// Go to top button functionality
const goToTopButton = document.getElementById('go-to-top');

// Show button when scrolling down 400px
window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    goToTopButton.classList.add('visible');
  } else {
    goToTopButton.classList.remove('visible');
  }
});

// Contact Form Handling
document
  .getElementById('contact-form')
  .addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      subject: document.getElementById('subject').value,
      message: document.getElementById('message').value
    };

    // You can handle the form submission here
    // For now, we'll just log the data and show a success message
    console.log('Form submitted:', formData);

    // Show success message
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check mr-2"></i>Message Sent!';
    button.disabled = true;
    button.classList.add('bg-green-500', 'hover:bg-green-600');

    // Reset form and button after 3 seconds
    setTimeout(() => {
      e.target.reset();
      button.innerHTML = originalText;
      button.disabled = false;
      button.classList.remove('bg-green-500', 'hover:bg-green-600');
    }, 3000);
  });
