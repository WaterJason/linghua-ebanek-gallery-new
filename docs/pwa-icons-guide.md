# PWA 图标创建指南

为了使 PWA 应用程序正常工作，您需要创建以下图标并将它们放置在 `public/icons` 目录中：

## 所需图标

1. **icon-192x192.png** - 192x192 像素
2. **icon-384x384.png** - 384x384 像素
3. **icon-512x512.png** - 512x512 像素

## 创建图标的方法

### 方法 1: 使用在线工具

1. 访问 [PWA Image Generator](https://tools.crawlink.com/tools/pwa-icon-generator/)
2. 上传您的高分辨率徽标图像
3. 生成所有必要的图标
4. 下载并将它们放置在 `public/icons` 目录中

### 方法 2: 使用设计软件

如果您有 Photoshop、Illustrator 或 Sketch 等设计软件，您可以：

1. 创建一个 512x512 像素的画布
2. 设计您的图标或导入现有徽标
3. 导出为不同尺寸 (192x192, 384x384, 512x512)
4. 将它们保存为 PNG 格式
5. 将它们放置在 `public/icons` 目录中

### 方法 3: 临时使用占位图标

在开发阶段，您可以使用以下命令生成简单的占位图标：

```bash
# 安装 ImageMagick (如果尚未安装)
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# 生成占位图标
convert -size 192x192 xc:#007aff -fill white -gravity center -font Arial -pointsize 72 -annotate 0 "LH" public/icons/icon-192x192.png
convert -size 384x384 xc:#007aff -fill white -gravity center -font Arial -pointsize 144 -annotate 0 "LH" public/icons/icon-384x384.png
convert -size 512x512 xc:#007aff -fill white -gravity center -font Arial -pointsize 192 -annotate 0 "LH" public/icons/icon-512x512.png
```

## 图标设计建议

1. **简单明了** - 使用简单的设计，避免复杂的细节
2. **可识别** - 确保图标在小尺寸下仍然可识别
3. **安全区域** - 将主要内容保持在中心区域，避免靠近边缘
4. **一致性** - 确保所有尺寸的图标看起来一致
5. **颜色** - 使用与您的品牌一致的颜色

## 测试图标

创建图标后，您可以通过以下方式测试它们：

1. 启动您的应用程序
2. 在移动设备上访问它
3. 尝试将应用程序添加到主屏幕
4. 验证图标是否正确显示
