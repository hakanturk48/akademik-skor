const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(process.env.GITHUB_PAGES_DIST_DIR || 'dist');
const basePath = String(process.env.GITHUB_PAGES_BASE_PATH || '')
  .replace(/^\/+|\/+$/g, '');

if (!fs.existsSync(distDir)) {
  throw new Error('Static export directory not found: ' + distDir);
}

const urlStart = /(^|[("'=:\s])\/(?=(?:_expo|assets|fonts|favicon\.ico)(?:[/"')?\s]|$))/g;

function rewriteAssetUrls(content) {
  if (!basePath) return content;
  return content.replace(urlStart, '$1/' + basePath + '/');
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath];
  });
}

function rewriteExportedFiles() {
  for (const filePath of listFiles(distDir)) {
    if (!/\.(html|js|css)$/.test(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, rewriteAssetUrls(content), 'utf8');
  }
}

function createPrettyRouteCopies() {
  for (const filePath of listFiles(distDir)) {
    if (!filePath.endsWith('.html')) continue;

    const relativePath = path.relative(distDir, filePath);
    const normalized = relativePath.split(path.sep).join('/');
    const fileName = path.basename(normalized);

    if (fileName === 'index.html' || fileName === '+not-found.html' || normalized.includes('[')) {
      continue;
    }

    const routeName = fileName.slice(0, -'.html'.length);
    const destination = path.join(path.dirname(filePath), routeName, 'index.html');
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(filePath, destination);
  }

  const notFound = path.join(distDir, '+not-found.html');
  if (fs.existsSync(notFound)) {
    fs.copyFileSync(notFound, path.join(distDir, '404.html'));
  }
}

rewriteExportedFiles();
createPrettyRouteCopies();

console.log(
  'Prepared GitHub Pages output at ' +
    distDir +
    (basePath ? ' with base path /' + basePath + '/' : '')
);
