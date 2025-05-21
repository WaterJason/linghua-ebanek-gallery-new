/**
 * 图片工具函数
 */

/**
 * 压缩图片
 * @param file 要压缩的图片文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 压缩质量 (0-1)
 * @returns 压缩后的文件
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // 如果不是图片，直接返回原文件
      if (!file.type.startsWith('image/')) {
        console.log('非图片文件，跳过压缩:', file.name, file.type);
        return resolve(file);
      }

      // 如果是GIF，不进行压缩
      if (file.type === 'image/gif') {
        console.log('GIF文件，跳过压缩:', file.name);
        return resolve(file);
      }

      // 如果文件太小（小于100KB），不进行压缩
      if (file.size < 100 * 1024) {
        console.log('文件较小，跳过压缩:', file.name, `${(file.size / 1024).toFixed(2)}KB`);
        return resolve(file);
      }

      console.log('开始压缩图片:', file.name, `${(file.size / 1024).toFixed(2)}KB`);

      // 创建图片对象
      const img = new Image();

      // 设置跨域属性（如果需要）
      img.crossOrigin = 'anonymous';

      // 创建对象URL
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      // 设置超时处理
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        console.warn('图片加载超时，使用原始图片:', file.name);
        resolve(file);
      }, 10000); // 10秒超时

      img.onload = () => {
        // 清除超时
        clearTimeout(timeout);

        // 释放URL对象
        URL.revokeObjectURL(objectUrl);

        try {
          // 计算新的尺寸
          let width = img.width;
          let height = img.height;

          console.log('原始图片尺寸:', width, 'x', height);

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          if (height > maxHeight && maxHeight > 0) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          console.log('压缩后尺寸:', width, 'x', height);

          // 创建canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          // 绘制图片
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('无法创建canvas上下文，使用原始图片');
            return resolve(file);
          }

          // 尝试绘制图片
          try {
            ctx.drawImage(img, 0, 0, width, height);
          } catch (drawError) {
            console.error('绘制图片到Canvas失败:', drawError);
            return resolve(file);
          }

          // 确定输出格式
          let outputType = file.type;

          // 对于某些不常见的格式，转换为jpeg
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(outputType)) {
            console.log('转换不常见格式为jpeg:', outputType);
            outputType = 'image/jpeg';
          }

          // 转换为Blob，添加超时处理
          const blobTimeout = setTimeout(() => {
            console.warn('Canvas转Blob超时，使用原始图片');
            resolve(file);
          }, 5000); // 5秒超时

          try {
            canvas.toBlob(
              (blob) => {
                clearTimeout(blobTimeout);

                if (!blob) {
                  console.warn('Canvas转Blob失败，使用原始图片');
                  return resolve(file);
                }

                // 创建新文件
                try {
                  const compressedFile = new File([blob], file.name, {
                    type: outputType,
                    lastModified: Date.now(),
                  });

                  console.log('压缩成功:',
                    `原始大小: ${(file.size / 1024).toFixed(2)}KB`,
                    `压缩后: ${(compressedFile.size / 1024).toFixed(2)}KB`,
                    `压缩率: ${(100 - (compressedFile.size / file.size * 100)).toFixed(2)}%`
                  );

                  resolve(compressedFile);
                } catch (fileError) {
                  console.error('创建压缩文件失败:', fileError);
                  resolve(file);
                }
              },
              outputType,
              quality
            );
          } catch (blobError) {
            clearTimeout(blobTimeout);
            console.error('调用toBlob方法失败:', blobError);
            resolve(file);
          }
        } catch (processError) {
          console.error('处理图片过程中出错:', processError);
          resolve(file);
        }
      };

      img.onerror = (error) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        console.error('图片加载失败:', error);
        // 出错时返回原始文件而不是拒绝Promise
        resolve(file);
      };
    } catch (error) {
      console.error('图片压缩过程中发生未捕获的错误:', error);
      // 出现任何错误，都返回原始文件
      resolve(file);
    }
  });
}

/**
 * 批量压缩图片
 * @param files 要压缩的图片文件数组
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 压缩质量 (0-1)
 * @returns 压缩后的文件数组
 */
export async function compressImages(
  files: File[],
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File[]> {
  console.log(`开始批量压缩 ${files.length} 个文件`);

  try {
    // 使用Promise.allSettled而不是Promise.all，确保一个文件失败不会影响其他文件
    const results = await Promise.allSettled(
      files.map(file => compressImage(file, maxWidth, maxHeight, quality))
    );

    // 处理结果
    const processedFiles = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // 如果压缩失败，返回原始文件
        console.warn(`文件 ${files[index].name} 压缩失败，使用原始文件:`, result.reason);
        return files[index];
      }
    });

    console.log(`批量压缩完成，成功处理 ${processedFiles.length} 个文件`);
    return processedFiles;
  } catch (error) {
    console.error('批量压缩过程中发生错误:', error);
    // 如果整个过程失败，返回原始文件
    return files;
  }
}

/**
 * 获取图片的尺寸
 * @param file 图片文件
 * @returns 图片尺寸 {width, height}
 */
export function getImageDimensions(file: File): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        width: img.width,
        height: img.height
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('图片加载失败'));
    };
  });
}

/**
 * 旋转图片
 * @param file 图片文件
 * @param degrees 旋转角度
 * @returns 旋转后的文件
 */
export async function rotateImage(file: File, degrees: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('无法创建canvas上下文'));
      }

      // 根据旋转角度设置canvas尺寸
      if (degrees % 180 === 0) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }

      // 移动到中心点
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // 旋转
      ctx.rotate((degrees * Math.PI) / 180);

      // 绘制图片
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('图片旋转失败'));
          }

          // 创建新文件
          const rotatedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(rotatedFile);
        },
        file.type
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('图片加载失败'));
    };
  });
}
