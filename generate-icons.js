// 使用 Node.js 创建简单的 PNG 图标
const fs = require('fs');
const path = require('path');

// 不同尺寸的简单 PNG 图标（蓝色背景，白色树形文字）
// 这是一个最小的有效 PNG 文件数据

function createSimplePNG(size) {
    // 创建一个简单的纯色 PNG（蓝色背景）
    const canvas = {
        width: size,
        height: size,
        data: Buffer.alloc(size * size * 4)
    };

    // 填充蓝色背景
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            canvas.data[idx] = 74;      // R
            canvas.data[idx + 1] = 144; // G
            canvas.data[idx + 2] = 226; // B
            canvas.data[idx + 3] = 255; // A
        }
    }

    // 在中心绘制一个简单的白色方块作为"树"的表示
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    const blockSize = Math.max(Math.floor(size / 3), 2);

    for (let y = centerY - blockSize; y < centerY + blockSize; y++) {
        for (let x = centerX - blockSize; x < centerX + blockSize; x++) {
            if (x >= 0 && x < size && y >= 0 && y < size) {
                const idx = (y * size + x) * 4;
                canvas.data[idx] = 255;     // R
                canvas.data[idx + 1] = 255; // G
                canvas.data[idx + 2] = 255; // B
                canvas.data[idx + 3] = 255; // A
            }
        }
    }

    return encodePNG(canvas);
}

function encodePNG(canvas) {
    const { width, height, data } = canvas;

    // PNG 文件头
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdr = Buffer.alloc(25);
    ihdr.writeUInt32BE(13, 0); // 长度
    ihdr.write('IHDR', 4);
    ihdr.writeUInt32BE(width, 8);
    ihdr.writeUInt32BE(height, 12);
    ihdr.writeUInt8(8, 16);  // 位深度
    ihdr.writeUInt8(6, 17);  // 颜色类型 (RGBA)
    ihdr.writeUInt8(0, 18);  // 压缩方法
    ihdr.writeUInt8(0, 19);  // 过滤方法
    ihdr.writeUInt8(0, 20);  // 交错方法
    const ihdrCRC = crc32(ihdr.slice(4, 21));
    ihdr.writeUInt32BE(ihdrCRC, 21);

    // IDAT chunk (简化的未压缩数据)
    // 为了简单，我们使用 zlib 压缩
    const zlib = require('zlib');

    // 准备像素数据（添加过滤器字节）
    const filteredData = Buffer.alloc(height * (1 + width * 4));
    for (let y = 0; y < height; y++) {
        filteredData[y * (1 + width * 4)] = 0; // 过滤器类型：无
        data.copy(filteredData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
    }

    const compressed = zlib.deflateSync(filteredData);
    const idat = Buffer.alloc(12 + compressed.length);
    idat.writeUInt32BE(compressed.length, 0);
    idat.write('IDAT', 4);
    compressed.copy(idat, 8);
    const idatCRC = crc32(idat.slice(4, 8 + compressed.length));
    idat.writeUInt32BE(idatCRC, 8 + compressed.length);

    // IEND chunk
    const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

    return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(buf) {
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c;
    }

    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

// 生成图标
const sizes = [16, 32, 48, 128];
const iconDir = path.join(__dirname, 'dist-dev', 'assets', 'icons');

// 确保目录存在
if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
}

console.log('🎨 生成 PNG 图标...\n');

sizes.forEach(size => {
    const png = createSimplePNG(size);
    const filename = path.join(iconDir, `icon-${size}.png`);
    fs.writeFileSync(filename, png);
    const fileSize = fs.statSync(filename).size;
    console.log(`✅ 创建 icon-${size}.png (${fileSize} bytes)`);
});

console.log('\n✨ 所有图标创建完成！');
console.log('📍 位置:', iconDir);
