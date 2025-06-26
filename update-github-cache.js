// Script to fetch GitHub data and save it as JSON
// Run this script whenever you want to update your GitHub data cache

const fs = require('fs');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Add your token as an environment variable
const username = 'dimuthadithya';

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

    // Fetch languages for each repo
    const reposWithLanguages = await Promise.all(
      repos.map(async (repo) => {
        const languages = await fetchJson(repo.languages_url, options);
        return { ...repo, languages };
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
      repos: reposWithLanguages,
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
