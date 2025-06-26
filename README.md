# Dimuth Adithya - Portfolio

This is the source code for [dimuthadithya.me](https://dimuthadithya.me), the personal portfolio website of Dimuth Adithya. The site showcases projects, skills, and experience, and dynamically displays GitHub repositories and stats.

## Features

- Responsive portfolio website built with HTML, CSS (Tailwind), and JavaScript
- Dynamic loading of GitHub repositories and user stats from a cached JSON file ([data/github-data.json](data/github-data.json))
- Project cards with language, stars, forks, topics, and demo/source links
- Downloadable resume ([assets/doc/Dimuth Adithya.pdf](assets/doc/Dimuth%20Adithya.pdf))
- Animated UI with [ScrollReveal](https://scrollrevealjs.org/) and [Typed.js](https://github.com/mattboldt/typed.js/)
- Custom favicon and branding

## Project Structure

```
CNAME
index.html
update-github-cache.js
assets/
  doc/
    Dimuth Adithya.docx
    Dimuth Adithya.pdf
  img/
    logo.png
data/
  github-data.json
```

- `index.html`: Main website file
- `update-github-cache.js`: Script to fetch and cache GitHub data
- `data/github-data.json`: Cached GitHub profile and repo data
- `assets/`: Images and documents

## How It Works

- The site loads GitHub data from `data/github-data.json` for fast, API-friendly display.
- To update the GitHub data, run the Node.js script:

  ```sh
  node update-github-cache.js
  ```

- The site is fully static and can be hosted on GitHub Pages or any static hosting provider.

## Customization

- Update your resume in `assets/doc/`
- Change the logo in `assets/img/logo.png`
- Edit `index.html` for content and layout changes

## License

This project is for personal use. If you wish to reuse or adapt, please credit [Dimuth Adithya](https://github.com/dimuthadithya).

---

**Live Site:**
