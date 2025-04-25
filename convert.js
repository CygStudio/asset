const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

// 定義轉換的目錄
const avatarDir = path.join(__dirname, 'avatar');
const imageDir = path.join(__dirname, 'image');

// 確保輸出目錄存在
const webpAvatarDir = path.join(__dirname, 'avatar-webp');
const webpImageDir = path.join(__dirname, 'image-webp');
fs.ensureDirSync(webpAvatarDir);
fs.ensureDirSync(webpImageDir);

// 讀取 message.json
const outputPath = path.join(__dirname, 'message.json');
const output = fs.readJsonSync(outputPath);

// 轉換函數
async function convertToWebP(inputPath, outputDir, originalFilename) {
  try {
    // 建立輸出檔名 (將原副檔名替換為 .webp)
    const outputFilename = path.basename(originalFilename, path.extname(originalFilename)) + '.webp';
    const outputPath = path.join(outputDir, outputFilename);

    // 使用 sharp 進行轉換
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    console.log(`已轉換: ${inputPath} -> ${outputPath}`);
    return outputFilename;
  } catch (error) {
    console.error(`轉換出錯 ${inputPath}: ${error.message}`);
    return null;
  }
}

// 處理所有頭像
async function processAvatars() {
  const avatarFiles = await fs.readdir(avatarDir);
  
  for (const file of avatarFiles) {
    const inputPath = path.join(avatarDir, file);
    await convertToWebP(inputPath, webpAvatarDir, file);
  }
}

// 處理所有圖片
async function processImages() {
  const imageFiles = await fs.readdir(imageDir);
  
  for (const file of imageFiles) {
    const inputPath = path.join(imageDir, file);
    await convertToWebP(inputPath, webpImageDir, file);
  }
}

// 更新 JSON 檔案中的路徑
function updateJsonPaths() {
  // 更新 avatar 路徑
  for (const item of output) {
    if (item.avatar) {
      const filename = path.basename(item.avatar);
      const newFilename = path.basename(filename, path.extname(filename)) + '.webp';
      item.avatar = `avatar-webp/${newFilename}`;
    }

    // 更新 image 路徑 (如果有的話)
    if (item.image && item.image !== '') {
      const filename = path.basename(item.image);
      const newFilename = path.basename(filename, path.extname(filename)) + '.webp';
      item.image = `image-webp/${newFilename}`;
    }
  }

  // 寫回 JSON 檔案
  fs.writeJsonSync(outputPath, output, { spaces: 2 });
  console.log('已更新 output.json 檔案中的路徑');
}

// 執行轉換並更新 JSON
async function main() {
  try {
    await processAvatars();
    await processImages();
    updateJsonPaths();
    console.log('轉換完成！');
  } catch (error) {
    console.error('處理過程發生錯誤:', error);
  }
}

main();
