const fs = require('fs');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const username = 'dimuthadithya';

// Function to fetch raw content directly
function fetchRawContent(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
        if (res.statusCode === 404) {
          resolve(null);
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', () => resolve(null));
  });
}

// Extract image URLs from README
function extractImagesFromMarkdown(markdown, repo) {
  if (!markdown) return [];
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const matches = [...markdown.matchAll(imageRegex)];

  return matches
    .map((match) => {
      let url = match[1];
      if (!url.startsWith('http')) {
        url = `https://raw.githubusercontent.com/${username}/${
          repo.name
        }/main/${url.replace(/^\//, '')}`;
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
          Accept: 'application/vnd.github.mercy-preview+json'
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

    // Process each repo
    const filteredRepos = await Promise.all(
      repos.map(async (repo) => {
        const topicsData = await fetchJson(
          `https://api.github.com/repos/${username}/${repo.name}/topics`,
          options
        );

        if (!topicsData.names || !topicsData.names.includes('project')) {
          return null;
        }

        const languages = await fetchJson(repo.languages_url, options);

        // Fetch README.md directly
        const readmeUrl = `https://raw.githubusercontent.com/${username}/${repo.name}/main/README.md`;
        console.log(`Trying to fetch README from: ${readmeUrl}`);
        const readmeContent = await fetchRawContent(readmeUrl);

        let readmeImages = [];
        if (readmeContent) {
          console.log(
            `Found README for ${repo.name}, length: ${readmeContent.length} bytes`
          );
          readmeImages = extractImagesFromMarkdown(readmeContent, repo);
          if (readmeImages.length > 0) {
            console.log(
              `Found ${readmeImages.length} images in README for ${repo.name}`
            );
          } else {
            console.log(`No images found in README for ${repo.name}`);
          }
        } else {
          console.log(`No README found for ${repo.name}`);
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

    // Calculate stats
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
