const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const publicImagesDir = path.join(rootDir, 'public', 'images');
const srcAssetsImagesDir = path.join(rootDir, 'src', 'assets', 'images');

if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}
if (!fs.existsSync(srcAssetsImagesDir)) {
  fs.mkdirSync(srcAssetsImagesDir, { recursive: true });
}

let count = 0;

// Copy from public/images to src/assets/images if missing
if (fs.existsSync(publicImagesDir)) {
  const files = fs.readdirSync(publicImagesDir);
  for (const f of files) {
    const src = path.join(publicImagesDir, f);
    const dest = path.join(srcAssetsImagesDir, f);
    if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      count++;
    }
  }
}

// Copy from src/assets/images to public/images if missing
if (fs.existsSync(srcAssetsImagesDir)) {
  const files = fs.readdirSync(srcAssetsImagesDir);
  for (const f of files) {
    const src = path.join(srcAssetsImagesDir, f);
    const dest = path.join(publicImagesDir, f);
    if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      count++;
    }
  }
}

console.log(`[Prepare Images] Synced images between public/images and src/assets/images (${count} copied).`);
