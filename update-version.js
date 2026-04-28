const fs = require('fs');
const { execSync } = require('child_process');

const htmlPath = './index.html';

// Obtiene hash corto y fecha
type VersionInfo = {
  hash: string;
  date: string;
};

function getVersionInfo() {
  const hash = execSync('git rev-parse --short HEAD').toString().trim();
  const date = execSync('git log -1 --format=%cd --date=short').toString().trim();
  return { hash, date };
}

function updateHtmlVersion(versionString) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(
    /<footer class="app-version">.*?<\/footer>/,
    `<footer class="app-version">${versionString}</footer>`
  );
  fs.writeFileSync(htmlPath, html, 'utf8');
}

const { hash, date } = getVersionInfo();
const versionString = `Versión: ${hash} - ${date}`;
updateHtmlVersion(versionString);
console.log('Versión actualizada:', versionString);
