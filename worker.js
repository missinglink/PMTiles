//407db08
// ../../js/dist/index.mjs
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x2) => x2.done ? resolve(x2.value) : Promise.resolve(x2.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var u8 = Uint8Array;
var u16 = Uint16Array;
var u32 = Uint32Array;
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]);
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new u32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return [b, r];
};
var _a = freb(fleb, 2);
var fl = _a[0];
var revfl = _a[1];
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b[0];
var revfd = _b[1];
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >>> 1 | (i & 21845) << 1;
  x = (x & 52428) >>> 2 | (x & 13107) << 2;
  x = (x & 61680) >>> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >>> 8 | (x & 255) << 8) >>> 1;
}
var i;
var x;
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var et = /* @__PURE__ */ new u8(0);
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var shift = (n, shift2) => {
  return n * Math.pow(2, shift2);
};
var unshift = (n, shift2) => {
  return Math.floor(n / Math.pow(2, shift2));
};
var getUint24 = (view, pos) => {
  return shift(view.getUint16(pos + 1, true), 8) + view.getUint8(pos);
};
var getUint48 = (view, pos) => {
  return shift(view.getUint32(pos + 2, true), 16) + view.getUint16(pos, true);
};
var compare = (tz, tx, ty, view, i) => {
  if (tz != view.getUint8(i))
    return tz - view.getUint8(i);
  const x2 = getUint24(view, i + 1);
  if (tx != x2)
    return tx - x2;
  const y = getUint24(view, i + 4);
  if (ty != y)
    return ty - y;
  return 0;
};
var queryLeafdir = (view, z, x2, y) => {
  const offset_len = queryView(view, z | 128, x2, y);
  if (offset_len) {
    return {
      z,
      x: x2,
      y,
      offset: offset_len[0],
      length: offset_len[1],
      is_dir: true
    };
  }
  return null;
};
var queryTile = (view, z, x2, y) => {
  const offset_len = queryView(view, z, x2, y);
  if (offset_len) {
    return {
      z,
      x: x2,
      y,
      offset: offset_len[0],
      length: offset_len[1],
      is_dir: false
    };
  }
  return null;
};
var queryView = (view, z, x2, y) => {
  let m = 0;
  let n = view.byteLength / 17 - 1;
  while (m <= n) {
    const k = n + m >> 1;
    const cmp = compare(z, x2, y, view, k * 17);
    if (cmp > 0) {
      m = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      return [getUint48(view, k * 17 + 7), view.getUint32(k * 17 + 13, true)];
    }
  }
  return null;
};
var queryLeafLevel = (view) => {
  if (view.byteLength < 17)
    return null;
  const numEntries = view.byteLength / 17;
  const entry = parseEntry(view, numEntries - 1);
  if (entry.is_dir)
    return entry.z;
  return null;
};
var entrySort = (a, b) => {
  if (a.is_dir && !b.is_dir) {
    return 1;
  }
  if (!a.is_dir && b.is_dir) {
    return -1;
  }
  if (a.z !== b.z) {
    return a.z - b.z;
  }
  if (a.x !== b.x) {
    return a.x - b.x;
  }
  return a.y - b.y;
};
var parseEntry = (dataview, i) => {
  const z_raw = dataview.getUint8(i * 17);
  const z = z_raw & 127;
  return {
    z,
    x: getUint24(dataview, i * 17 + 1),
    y: getUint24(dataview, i * 17 + 4),
    offset: getUint48(dataview, i * 17 + 7),
    length: dataview.getUint32(i * 17 + 13, true),
    is_dir: z_raw >> 7 === 1
  };
};
var sortDir = (dataview) => {
  const entries = [];
  for (let i = 0; i < dataview.byteLength / 17; i++) {
    entries.push(parseEntry(dataview, i));
  }
  return createDirectory(entries);
};
var createDirectory = (entries) => {
  entries.sort(entrySort);
  const buffer = new ArrayBuffer(17 * entries.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let z = entry.z;
    if (entry.is_dir)
      z = z | 128;
    arr[i * 17] = z;
    arr[i * 17 + 1] = entry.x & 255;
    arr[i * 17 + 2] = entry.x >> 8 & 255;
    arr[i * 17 + 3] = entry.x >> 16 & 255;
    arr[i * 17 + 4] = entry.y & 255;
    arr[i * 17 + 5] = entry.y >> 8 & 255;
    arr[i * 17 + 6] = entry.y >> 16 & 255;
    arr[i * 17 + 7] = entry.offset & 255;
    arr[i * 17 + 8] = unshift(entry.offset, 8) & 255;
    arr[i * 17 + 9] = unshift(entry.offset, 16) & 255;
    arr[i * 17 + 10] = unshift(entry.offset, 24) & 255;
    arr[i * 17 + 11] = unshift(entry.offset, 32) & 255;
    arr[i * 17 + 12] = unshift(entry.offset, 48) & 255;
    arr[i * 17 + 13] = entry.length & 255;
    arr[i * 17 + 14] = entry.length >> 8 & 255;
    arr[i * 17 + 15] = entry.length >> 16 & 255;
    arr[i * 17 + 16] = entry.length >> 24 & 255;
  }
  return new DataView(arr.buffer, arr.byteOffset, arr.length);
};
var deriveLeaf = (root, tile) => {
  const leaf_level = queryLeafLevel(root.dir);
  if (leaf_level) {
    const level_diff = tile.z - leaf_level;
    const leaf_x = Math.trunc(tile.x / (1 << level_diff));
    const leaf_y = Math.trunc(tile.y / (1 << level_diff));
    return { z: leaf_level, x: leaf_x, y: leaf_y };
  }
  return null;
};
var parseHeader = (dataview) => {
  const magic = dataview.getUint16(0, true);
  if (magic !== 19792) {
    throw new Error('File header does not begin with "PM"');
  }
  const version = dataview.getUint16(2, true);
  const json_size = dataview.getUint32(4, true);
  const root_entries = dataview.getUint16(8, true);
  return {
    version,
    json_size,
    root_entries
  };
};
var FetchSource = class {
  constructor(url) {
    this.url = url;
  }
  getKey() {
    return this.url;
  }
  getBytes(offset, length) {
    return __async(this, null, function* () {
      const controller = new AbortController();
      const signal = controller.signal;
      const resp = yield fetch(this.url, {
        signal,
        headers: { Range: "bytes=" + offset + "-" + (offset + length - 1) }
      });
      const contentLength = resp.headers.get("Content-Length");
      if (!contentLength || +contentLength !== length) {
        console.error("Content-Length mismatch indicates byte serving not supported; aborting.");
        controller.abort();
      }
      const a = yield resp.arrayBuffer();
      return new DataView(a);
    });
  }
};
var LRUCacheSource = class {
  constructor(source, maxEntries) {
    this.getKey = () => {
      return this.source.getKey();
    };
    this.source = source;
    this.entries = /* @__PURE__ */ new Map();
    this.maxEntries = maxEntries;
  }
  getBytes(offset, length) {
    return __async(this, null, function* () {
      let val = this.entries.get(offset + "-" + length);
      if (val) {
        val.lastUsed = performance.now();
        return val.buffer;
      }
      let promise = this.source.getBytes(offset, length);
      this.entries.set(offset + "-" + length, {
        lastUsed: performance.now(),
        buffer: promise
      });
      if (this.entries.size > this.maxEntries) {
        let minUsed = Infinity;
        let minKey = void 0;
        this.entries.forEach((val2, key) => {
          if (val2.lastUsed < minUsed) {
            minUsed = val2.lastUsed;
            minKey = key;
          }
        });
        if (minKey)
          this.entries.delete(minKey);
      }
      return promise;
    });
  }
};
var PMTiles = class {
  constructor(source, maxLeaves = 64) {
    if (typeof source === "string") {
      this.source = new LRUCacheSource(new FetchSource(source), maxLeaves);
    } else {
      this.source = source;
    }
  }
  fetchRoot() {
    return __async(this, null, function* () {
      const v = yield this.source.getBytes(0, 512e3);
      const header = parseHeader(new DataView(v.buffer, v.byteOffset, 10));
      let root_dir = new DataView(v.buffer, 10 + header.json_size, 17 * header.root_entries);
      if (header.version === 1) {
        console.warn("Sorting pmtiles v1 directory");
        root_dir = sortDir(root_dir);
      }
      return {
        header,
        view: v,
        dir: root_dir
      };
    });
  }
  root_entries() {
    return __async(this, null, function* () {
      const root = yield this.fetchRoot();
      let entries = [];
      for (var i = 0; i < root.header.root_entries; i++) {
        entries.push(parseEntry(root.dir, i));
      }
      return entries;
    });
  }
  metadata() {
    return __async(this, null, function* () {
      const root = yield this.fetchRoot();
      const dec = new TextDecoder("utf-8");
      const result = JSON.parse(dec.decode(new DataView(root.view.buffer, root.view.byteOffset + 10, root.header.json_size)));
      if (result.compression) {
        console.warn(`Archive has compression type: ${result.compression} and may not be readable directly by browsers.`);
      }
      if (!result.bounds) {
        console.warn(`Archive is missing 'bounds' in metadata, required in v2 and above.`);
      }
      if (!result.minzoom) {
        console.warn(`Archive is missing 'minzoom' in metadata, required in v2 and above.`);
      }
      if (!result.maxzoom) {
        console.warn(`Archive is missing 'maxzoom' in metadata, required in v2 and above.`);
      }
      return result;
    });
  }
  fetchLeafdir(version, entry) {
    return __async(this, null, function* () {
      let buf = yield this.source.getBytes(entry.offset, entry.length);
      if (version === 1) {
        console.warn("Sorting pmtiles v1 directory.");
        buf = sortDir(buf);
      }
      return buf;
    });
  }
  getLeafdir(version, entry) {
    return __async(this, null, function* () {
      return this.fetchLeafdir(version, entry);
    });
  }
  getZxy(z, x2, y) {
    return __async(this, null, function* () {
      const root = yield this.fetchRoot();
      const entry = queryTile(new DataView(root.dir.buffer, root.dir.byteOffset, root.dir.byteLength), z, x2, y);
      if (entry)
        return entry;
      const leafcoords = deriveLeaf(root, { z, x: x2, y });
      if (leafcoords) {
        const leafdir_entry = queryLeafdir(new DataView(root.dir.buffer, root.dir.byteOffset, root.dir.byteLength), leafcoords.z, leafcoords.x, leafcoords.y);
        if (leafdir_entry) {
          const leafdir = yield this.getLeafdir(root.header.version, leafdir_entry);
          return queryTile(new DataView(leafdir.buffer, leafdir.byteOffset, leafdir.byteLength), z, x2, y);
        }
      }
      return null;
    });
  }
};

// worker.ts
var KeyNotFoundError = class extends Error {
  constructor(message) {
    super(message);
  }
};
var LRUCache = class {
  constructor() {
    this.entries = /* @__PURE__ */ new Map();
    this.counter = 0;
  }
  async get(bucket, key, offset, length) {
    let cacheKey = key + ":" + offset + "-" + length;
    let val = this.entries.get(cacheKey);
    if (val) {
      val.lastUsed = this.counter++;
      return [true, val.buffer];
    }
    let resp = await bucket.get(key, {
      range: { offset, length }
    });
    if (!resp) {
      throw new KeyNotFoundError("Key not found");
    }
    let a = await resp.arrayBuffer();
    let d = new DataView(a);
    this.entries.set(cacheKey, {
      lastUsed: this.counter++,
      buffer: d
    });
    if (this.entries.size > 128) {
      let minUsed = Infinity;
      let minKey = void 0;
      this.entries.forEach((val2, key2) => {
        if (val2.lastUsed < minUsed) {
          minUsed = val2.lastUsed;
          minKey = key2;
        }
      });
      if (minKey)
        this.entries.delete(minKey);
    }
    return [false, d];
  }
};
var worker_cache = new LRUCache();
var pmtiles_path = (p, name) => {
  if (p) {
    return p.replace("{name}", name);
  }
  return name + ".pmtiles";
};
var TILE = new RegExp(/^\/([0-9a-zA-Z\/!\-_\.\*\'\(\)]+)\/(\d+)\/(\d+)\/(\d+).pbf$/);
var worker_default = {
  async fetch(request, env, context) {
    let url = new URL(request.url);
    let match = url.pathname.match(TILE);
    let subrequests = 1;
    if (match) {
      let name = match[1];
      let z = +match[2];
      let x2 = +match[3];
      let y = +match[4];
      class TempSource {
        getKey() {
          return "";
        }
        async getBytes(offset, length) {
          let result = await worker_cache.get(env.BUCKET, pmtiles_path(env.PMTILES_PATH, name), offset, length);
          if (!result[0])
            subrequests++;
          return result[1];
        }
      }
      let source = new TempSource();
      let p = new PMTiles(source);
      try {
        let metadata = await p.metadata();
        if (z < metadata.minzoom || z > metadata.maxzoom) {
          return new Response("Tile not found", { status: 404 });
        }
        let entry = await p.getZxy(z, x2, y);
        if (entry) {
          let tile = await env.BUCKET.get(pmtiles_path(env.PMTILES_PATH, name), {
            range: { offset: entry.offset, length: entry.length }
          });
          let headers = new Headers();
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Content-Type", "application/x-protobuf");
          headers.set("X-Pmap-Subrequests", subrequests.toString());
          if (metadata.compression === "gzip") {
            headers.set("Content-Encoding", "gzip");
          }
          return new Response(tile.body, {
            headers,
            encodeBody: "manual"
          });
        } else {
          return new Response(void 0, { status: 204 });
        }
      } catch (e) {
        if (e instanceof KeyNotFoundError) {
          return new Response("Archive not found", { status: 404 });
        } else {
          throw e;
        }
      }
    }
    return new Response("Invalid tile URL", { status: 400 });
  }
};
export {
  LRUCache,
  worker_default as default,
  pmtiles_path
};
