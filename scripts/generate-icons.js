import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, innerR, innerG, innerB) {
  // Simple solid color PNG with border/center circle
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;
  const coreRadius = width * 0.28;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < coreRadius) {
        rawData[pxOffset] = innerR;     // R
        rawData[pxOffset + 1] = innerG; // G
        rawData[pxOffset + 2] = innerB; // B
        rawData[pxOffset + 3] = 255;    // A
      } else if (dist < radius) {
        rawData[pxOffset] = r;          // R
        rawData[pxOffset + 1] = g;      // G
        rawData[pxOffset + 2] = b;      // B
        rawData[pxOffset + 3] = 255;    // A
      } else {
        rawData[pxOffset] = 8;          // Background #080E1D
        rawData[pxOffset + 1] = 14;
        rawData[pxOffset + 2] = 29;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const cyanR = 56, cyanG = 189, cyanB = 248; // #38BDF8
const blueR = 19, blueG = 27, blueB = 46;    // #131B2E

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, cyanR, cyanG, cyanB, 76, 215, 246));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, cyanR, cyanG, cyanB, 76, 215, 246));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, blueR, blueG, blueB, cyanR, cyanG, cyanB));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, cyanR, cyanG, cyanB, 76, 215, 246));
console.log('PWA icons created successfully');
