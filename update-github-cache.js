// Script to fetch GitHub data and save it as JSON
// Run this script whenever you want to update your GitHub data cache

const fs = require('fs');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Add your token as an environment variable
const username = 'dimuthadithya';

// Function to extract and convert image URLs from markdown content
function extractImagesFromMarkdown(markdown, repo) {
  if (!markdown) return [];
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const matches = [...markdown.matchAll(imageRegex)];

  return matches
    .map((match) => {
      let url = match[1];
      // Check if it's a relative path
      if (!url.startsWith('http')) {
        // Convert relative path to raw GitHub URL
        url = `https://raw.githubusercontent.com/${username}/${repo.name}/${
          repo.default_branch
        }/${url.replace(/^\//, '')}`;
      } else if (
        url.includes('github.com') &&
        !url.includes('raw.githubusercontent.com')
      ) {
        // Convert GitHub blob URLs to raw URLs
        url = url
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/');
      }
      return url;
    })
    .filter((url) => url);
}

async function fetchGitHubData() {
  const options = GITHUB_TOKEN
    ? {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'Node.js'
        }
      }
    : { headers: { 'User-Agent': 'Node.js' } };

  try {
    // Fetch user data
    const userData = await fetchJson(
      `https://api.github.com/users/${username}`,
      options
    );

    // Fetch all repositories
    const repos = await fetchJson(
      `https://api.github.com/users/${username}/repos?per_page=100`,
      options
    );

    // Fetch languages and README for each repo
    const reposWithDetails = await Promise.all(
      repos.map(async (repo) => {
        const languages = await fetchJson(repo.languages_url, options);

        // Fetch README content
        let readmeImages = [];
        try {
          const readmeResponse = await fetchJson(
            `https://api.github.com/repos/${username}/${repo.name}/readme`,
            options
          );
          const readmeContent = Buffer.from(
            readmeResponse.content,
            'base64'
          ).toString();
          readmeImages = extractImagesFromMarkdown(readmeContent, repo);
        } catch (error) {
          console.log(`No README found for ${repo.name}`);
        }

        return {
          ...repo,
          languages,
          cardImage: readmeImages[0] || null // Use the first image as card image
        };
      })
    );

    // Calculate additional stats
    const totalStars = repos.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0
    );
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    // Prepare final data object
    const githubData = {
      profile: userData,
      repos: reposWithDetails,
      stats: {
        totalStars,
        totalForks,
        totalRepos: repos.length,
        updatedAt: new Date().toISOString()
      }
    };

    // Save to file
    fs.writeFileSync(
      './data/github-data.json',
      JSON.stringify(githubData, null, 2)
    );
    console.log('GitHub data has been successfully cached!');
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
  }
}

function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    https
      .get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

fetchGitHubData();
