// convert_manual.js
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

async function convertToWebP(inputPath) {
  try {
    if (!await fs.pathExists(inputPath)) {
      console.error(`檔案不存在：${inputPath}`);
      return;
    }
    const { dir, name } = path.parse(inputPath);
    const outputPath = path.join(dir, name + '.webp');
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    console.log(`已轉換：${inputPath} → ${outputPath}`);
  } catch (err) {
    console.error(`轉換失敗 ${inputPath}：`, err.message);
  }
}

async function main() {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.log('用法：node convert_manual.js <圖片路徑1> [<圖片路徑2> …]');
    process.exit(1);
  }
  for (const p of inputs) {
    const absPath = path.resolve(p);
    const stats = await fs.stat(absPath);
    if (stats.isDirectory()) {
      const files = await fs.readdir(absPath);
      for (const file of files) {
        if (path.extname(file).toLowerCase() === '.webp') continue;
        await convertToWebP(path.join(absPath, file));
      }
    } else {
      await convertToWebP(absPath);
    }
  }
}

main();
