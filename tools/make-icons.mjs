/**
 * 生成 PWA 图标(icons/icon-192.png, icons/icon-512.png)
 * 纯 Node 实现的 PNG 编码器:漫威红底 + 白色字母 M
 * 用法: node tools/make-icons.mjs
 */
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- PNG 编码 ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(size, pixels /* RGBA Uint8Array */) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    pixels.subarray(y * size * 4, (y + 1) * size * 4).forEach((v, i) => {
      raw[y * (size * 4 + 1) + 1 + i] = v;
    });
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- 绘制 ---------- */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const x = ax + t * dx, y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

function drawIcon(S) {
  const px = new Uint8Array(S * S * 4);
  const m = S * 0.20;            // 字母外边距
  const bw = S * 0.15;           // 竖笔画宽
  const dw = bw * 0.62;          // 斜笔画半宽
  const top = m, bottom = S - m;
  const L1 = m, L2 = m + bw;                 // 左竖
  const R1 = S - m - bw, R2 = S - m;         // 右竖
  const valleyY = S * 0.66;                  // 中间 V 的谷底

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      // 底色:漫威红 → 深红渐变
      const g = y / S;
      let r = 230 - g * 40, gg = 36 - g * 12, b = 41 - g * 12;

      // 字母 M(白)
      let inM = false;
      if (y >= top && y <= bottom) {
        if ((x >= L1 && x <= L2) || (x >= R1 && x <= R2)) inM = true;
      }
      if (!inM) {
        const d1 = distToSegment(x, y, L2 - bw * 0.2, top, S / 2, valleyY);
        const d2 = distToSegment(x, y, R1 + bw * 0.2, top, S / 2, valleyY);
        if ((d1 < dw || d2 < dw) && y >= top && y <= valleyY + dw) inM = true;
      }
      if (inM) { r = 255; gg = 255; b = 255; }

      px[i] = r; px[i + 1] = gg; px[i + 2] = b; px[i + 3] = 255;
    }
  }
  return encodePNG(S, px);
}

fs.mkdirSync(path.join(ROOT, 'icons'), { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(ROOT, 'icons', `icon-${size}.png`), drawIcon(size));
  console.log(`icons/icon-${size}.png 已生成`);
}
