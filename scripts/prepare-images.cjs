const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src', 'assets', 'images');
const pubImgDir = path.join(process.cwd(), 'public', 'images');
const pubAssetsImgDir = path.join(process.cwd(), 'public', 'assets', 'images');

[pubImgDir, pubAssetsImgDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  let copied = 0;
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, path.join(pubImgDir, file));
      fs.copyFileSync(srcPath, path.join(pubAssetsImgDir, file));
      copied++;
    }
  }
  console.log(`[Prepare Images] Copied ${copied} images to public directories.`);
} else {
  console.log('[Prepare Images] No src/assets/images directory found, skipping.');
}
