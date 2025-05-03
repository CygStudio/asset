const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

// 定義要處理的目錄
const webpAvatarDir = path.join(__dirname, 'avatar-webp');
const webpImageDir = path.join(__dirname, 'image-webp');

// 最大尺寸限制
const MAX_DIMENSION = 1920;

// 檢查並調整圖片尺寸
async function resizeImage(inputPath) {
  try {
    // 讀取圖片資訊
    const metadata = await sharp(inputPath).metadata();
    
    // 檢查尺寸並決定是否需要縮放
    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      // 計算縮放比例
      const scaleFactor = Math.min(
        MAX_DIMENSION / metadata.width,
        MAX_DIMENSION / metadata.height
      );
      
      // 計算新尺寸
      const newWidth = Math.round(metadata.width * scaleFactor);
      const newHeight = Math.round(metadata.height * scaleFactor);
      
      // 進行縮放並覆蓋原檔案
      await sharp(inputPath)
        .resize(newWidth, newHeight)
        .webp({ quality: 80 })
        .toFile(inputPath + '.temp');
      
      // 覆蓋原檔案
      await fs.move(inputPath + '.temp', inputPath, { overwrite: true });
      
      console.log(`圖片尺寸縮小: ${inputPath} (${metadata.width}x${metadata.height} -> ${newWidth}x${newHeight})`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`處理出錯 ${inputPath}: ${error.message}`);
    return false;
  }
}

// 處理目錄中的所有圖片
async function processDirectory(directory) {
  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.webp') {
        const filePath = path.join(directory, file);
        await resizeImage(filePath);
      }
    }
    
    console.log(`目錄處理完成: ${directory}`);
  } catch (error) {
    console.error(`處理目錄出錯 ${directory}: ${error.message}`);
  }
}

// 主函數
async function main() {
  try {
    console.log('開始處理現有 WebP 圖片...');
    await processDirectory(webpAvatarDir);
    await processDirectory(webpImageDir);
    console.log('所有圖片處理完成！');
  } catch (error) {
    console.error('處理過程發生錯誤:', error);
  }
}

main();
