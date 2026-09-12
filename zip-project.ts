import AdmZip from 'adm-zip';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const distDir = path.join(rootDir, 'dist');

  // public ディレクトリがなければ作成
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('📁 public ディレクトリを作成しました。');
  }

  const releaseZipName = 'tobita-girls-website-release.zip';
  const sourceZipName = 'tobita-girls-source-code.zip';

  const rootReleaseZip = path.join(rootDir, releaseZipName);
  const rootSourceZip = path.join(rootDir, sourceZipName);
  
  const publicReleaseZip = path.join(publicDir, releaseZipName);
  const publicSourceZip = path.join(publicDir, sourceZipName);

  // 1. 古いZIPを削除
  [rootReleaseZip, rootSourceZip, publicReleaseZip, publicSourceZip].forEach(p => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  // ----------------------------------------------------
  // ① まず一時的に Production ビルドを一度実行して dist を作ります
  // ----------------------------------------------------
  console.log('📦 1. 一時Productionビルドを実行中...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ ビルド中にエラーが発生しました:', error);
  }

  // ----------------------------------------------------
  // ② 静的ウェブサイトZIP (dist フォルダ内容) の作成
  // ----------------------------------------------------
  console.log('📦 2. 本番用ウェブサイトZIP (tobita-girls-website-release.zip) を作成中...');
  if (fs.existsSync(distDir)) {
    const zipRelease = new AdmZip();
    const distItems = fs.readdirSync(distDir);
    for (const item of distItems) {
      if (item.endsWith('.zip')) continue;
      const fullPath = path.join(distDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        zipRelease.addLocalFolder(fullPath, item);
      } else {
        zipRelease.addLocalFile(fullPath);
      }
    }
    
    zipRelease.writeZip(rootReleaseZip);
    fs.copyFileSync(rootReleaseZip, publicReleaseZip);
    fs.copyFileSync(rootReleaseZip, path.join(distDir, releaseZipName));
    console.log(`✅ 作成完了: ${rootReleaseZip} (${(fs.statSync(rootReleaseZip).size / (1024 * 1024)).toFixed(2)} MB)`);
  } else {
    console.error('❌ distディレクトリが見つかりません。');
  }

  // ----------------------------------------------------
  // ③ ソースコード全体のZIP作成
  // ----------------------------------------------------
  console.log('📦 3. ソースコード一式ZIP (tobita-girls-source-code.zip) を作成中...');
  const zipSource = new AdmZip();
  
  const items = fs.readdirSync(rootDir);
  const excludeList = [
    'node_modules',
    'dist',
    '.git',
    '.github',
    releaseZipName,
    sourceZipName,
    '.DS_Store'
  ];

  for (const item of items) {
    if (excludeList.includes(item) || item.endsWith('.zip')) continue;
    
    const fullPath = path.join(rootDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      zipSource.addLocalFolder(fullPath, item);
    } else {
      zipSource.addLocalFile(fullPath);
    }
  }

  zipSource.writeZip(rootSourceZip);
  fs.copyFileSync(rootSourceZip, publicSourceZip);
  fs.copyFileSync(rootSourceZip, path.join(distDir, sourceZipName));
  console.log(`✅ 作成完了: ${rootSourceZip} (${(fs.statSync(rootSourceZip).size / (1024 * 1024)).toFixed(2)} MB)`);

  console.log('\n 🎉 すべてのZIPファイルの生成に成功しました！');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
