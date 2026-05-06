const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

function parseArgs(argv) {
  const options = {
    rotate: 0,
    resize: true,
    inputs: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--rotate') {
      options.rotate = Number(argv[index + 1] || 0);
      index += 1;
      continue;
    }

    if (arg.startsWith('--rotate=')) {
      options.rotate = Number(arg.split('=')[1] || 0);
      continue;
    }

    if (arg === '--no-resize') {
      options.resize = false;
      continue;
    }

    options.inputs.push(arg);
  }

  return options;
}

// 定義要處理的目錄
const webpAvatarDir = path.join(__dirname, 'avatar-webp');
const webpImageDir = path.join(__dirname, 'image-webp');

// 最大尺寸限制
const MAX_DIMENSION = 400;

// 檢查並調整圖片尺寸
async function resizeImage(inputPath, options = {}) {
  try {
    // 讀取圖片資訊
    const metadata = await sharp(inputPath).metadata();
    const shouldRotate = Number.isFinite(options.rotate) && options.rotate % 360 !== 0;
    const shouldResize = options.resize && (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION);
    
    // 檢查尺寸並決定是否需要縮放
    if (shouldResize || shouldRotate) {
      // 計算縮放比例
      const scaleFactor = Math.min(
        MAX_DIMENSION / metadata.width,
        MAX_DIMENSION / metadata.height
      );
      
      // 計算新尺寸
      const newWidth = Math.round(metadata.width * scaleFactor);
      const newHeight = Math.round(metadata.height * scaleFactor);

      let imageProcess = sharp(inputPath);

      if (shouldResize) {
        imageProcess = imageProcess.resize(newWidth, newHeight);
      }

      if (shouldRotate) {
        imageProcess = imageProcess.rotate(options.rotate);
      }
      
      // 進行處理並覆蓋原檔案
      await imageProcess
        .webp({ quality: 80 })
        .toFile(inputPath + '.temp');
      
      // 覆蓋原檔案
      await fs.move(inputPath + '.temp', inputPath, { overwrite: true });

      if (shouldResize && shouldRotate) {
        console.log(`圖片已縮放並旋轉: ${inputPath} (${metadata.width}x${metadata.height} -> ${newWidth}x${newHeight}, rotate ${options.rotate})`);
      } else if (shouldResize) {
        console.log(`圖片尺寸縮小: ${inputPath} (${metadata.width}x${metadata.height} -> ${newWidth}x${newHeight})`);
      } else {
        console.log(`圖片已旋轉: ${inputPath} (rotate ${options.rotate})`);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`處理出錯 ${inputPath}: ${error.message}`);
    return false;
  }
}

// 處理目錄中的所有圖片
async function processDirectory(directory, options = {}) {
  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.webp') {
        const filePath = path.join(directory, file);
        await resizeImage(filePath, options);
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
    const { inputs, rotate, resize } = parseArgs(process.argv.slice(2));

    if (!Number.isFinite(rotate)) {
      console.error('rotate 參數必須是數字');
      process.exit(1);
    }

    const options = { rotate, resize };

    if (inputs.length === 0) {
      console.log('開始處理現有 WebP 圖片 (預設目錄)...');
      await processDirectory(webpAvatarDir, options);
      await processDirectory(webpImageDir, options);
      console.log('所有預設目錄圖片處理完成！');
    } else {
      console.log('開始處理指定的 WebP 圖片...');
      for (const p of inputs) {
        const absPath = path.resolve(p);
        const stats = await fs.stat(absPath);
        if (stats.isDirectory()) {
          await processDirectory(absPath, options);
        } else {
          if (path.extname(absPath).toLowerCase() === '.webp') {
            await resizeImage(absPath, options);
          } else {
            console.log(`略過非 WebP 檔案: ${absPath}`);
          }
        }
      }
      console.log('所有指定圖片處理完成！');
    }
  } catch (error) {
    console.error('處理過程發生錯誤:', error);
  }
}

main();
