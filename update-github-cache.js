const fs = require('fs');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Add your token as env variable
const username = 'dimuthadithya';

// Extract image URLs from README
function extractImagesFromMarkdown(markdown, repo) {
  if (!markdown) return [];
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const matches = [...markdown.matchAll(imageRegex)];

  return matches
    .map((match) => {
      let url = match[1];
      if (!url.startsWith('http')) {
        url = `https://raw.githubusercontent.com/${username}/${repo.name}/${
          repo.default_branch
        }/${url.replace(/^\//, '')}`;
      } else if (
        url.includes('github.com') &&
        !url.includes('raw.githubusercontent.com')
      ) {
        url = url
          .replace('github.com', 'raw.githubusercontent.com')
          .replace('/blob/', '/');
      }
      return url;
    })
    .filter((url) => url);
}

// Fetch GitHub JSON helper
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

async function fetchGitHubData() {
  const options = GITHUB_TOKEN
    ? {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'Node.js',
          Accept: 'application/vnd.github.mercy-preview+json' // Needed for topics
        }
      }
    : { headers: { 'User-Agent': 'Node.js' } };

  try {
    // Fetch user profile
    const userData = await fetchJson(
      `https://api.github.com/users/${username}`,
      options
    );

    // Fetch repos
    const repos = await fetchJson(
      `https://api.github.com/users/${username}/repos?per_page=100`,
      options
    );

    if (!Array.isArray(repos)) {
      console.error('Failed to fetch repos:', repos);
      return;
    }

    // Filter repos with "project" topic
    const filteredRepos = await Promise.all(
      repos.map(async (repo) => {
        const topicsData = await fetchJson(
          `https://api.github.com/repos/${username}/${repo.name}/topics`,
          options
        );

        if (!topicsData.names || !topicsData.names.includes('project')) {
          return null; // skip repo
        }

        const languages = await fetchJson(repo.languages_url, options);

        // Try fetching README
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
        } catch (err) {
          console.log(`No README for ${repo.name}`);
        }

        return {
          ...repo,
          topics: topicsData.names,
          languages,
          cardImage: readmeImages[0] || null
        };
      })
    );

    const reposWithDetails = filteredRepos.filter(Boolean);

    // Stats
    const totalStars = reposWithDetails.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0
    );
    const totalForks = reposWithDetails.reduce(
      (sum, repo) => sum + repo.forks_count,
      0
    );

    const githubData = {
      profile: userData,
      repos: reposWithDetails,
      stats: {
        totalStars,
        totalForks,
        totalRepos: reposWithDetails.length,
        updatedAt: new Date().toISOString()
      }
    };

    fs.writeFileSync(
      './data/github-data.json',
      JSON.stringify(githubData, null, 2)
    );
    console.log('GitHub data cached successfully!');
  } catch (err) {
    console.error('Error fetching GitHub data:', err);
  }
}

fetchGitHubData();
