// 创建简单的插件图标
const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 32, 48, 128];
const iconDir = './src/assets/icons';

// 确保目录存在
if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
}

sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 绘制背景
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, 0, size, size);

    // 绘制简单的树形图标
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌲', size / 2, size / 2);

    // 保存为 PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`${iconDir}/icon-${size}.png`, buffer);
    console.log(`Created icon-${size}.png`);
});

console.log('All icons created successfully!');
