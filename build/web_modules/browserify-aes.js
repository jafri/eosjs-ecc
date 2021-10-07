import { c as createCommonjsModule } from './common/_commonjsHelpers-db517561.js';
import { B as Buffer$1 } from './common/buffer-es6-e6024076.js';
import { s as safeBuffer } from './common/index-7e6eb98b.js';
import './common/process-e9e98960.js';
import './common/util-8183cd0e.js';
import { i as inherits_browser, c as cipherBase } from './common/index-681c3834.js';
import { m as md5_js } from './common/index-c10fc565.js';

// based on the aes implimentation in triple sec
// https://github.com/keybase/triplesec

// which is in turn based on the one from crypto-js
// https://code.google.com/p/crypto-js/

var uint_max = Math.pow(2, 32);
function fixup_uint32 (x) {
  var ret, x_pos;
  ret = x > uint_max || x < 0 ? (x_pos = Math.abs(x) % uint_max, x < 0 ? uint_max - x_pos : x_pos) : x;
  return ret
}
function scrub_vec (v) {
  for (var i = 0; i < v.length; v++) {
    v[i] = 0;
  }
  return false
}

function Global () {
  this.SBOX = [];
  this.INV_SBOX = [];
  this.SUB_MIX = [[], [], [], []];
  this.INV_SUB_MIX = [[], [], [], []];
  this.init();
  this.RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
}

Global.prototype.init = function () {
  var d, i, sx, t, x, x2, x4, x8, xi, _i;
  d = (function () {
    var _i, _results;
    _results = [];
    for (i = _i = 0; _i < 256; i = ++_i) {
      if (i < 128) {
        _results.push(i << 1);
      } else {
        _results.push((i << 1) ^ 0x11b);
      }
    }
    return _results
  })();
  x = 0;
  xi = 0;
  for (i = _i = 0; _i < 256; i = ++_i) {
    sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
    sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
    this.SBOX[x] = sx;
    this.INV_SBOX[sx] = x;
    x2 = d[x];
    x4 = d[x2];
    x8 = d[x4];
    t = (d[sx] * 0x101) ^ (sx * 0x1010100);
    this.SUB_MIX[0][x] = (t << 24) | (t >>> 8);
    this.SUB_MIX[1][x] = (t << 16) | (t >>> 16);
    this.SUB_MIX[2][x] = (t << 8) | (t >>> 24);
    this.SUB_MIX[3][x] = t;
    t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
    this.INV_SUB_MIX[0][sx] = (t << 24) | (t >>> 8);
    this.INV_SUB_MIX[1][sx] = (t << 16) | (t >>> 16);
    this.INV_SUB_MIX[2][sx] = (t << 8) | (t >>> 24);
    this.INV_SUB_MIX[3][sx] = t;
    if (x === 0) {
      x = xi = 1;
    } else {
      x = x2 ^ d[d[d[x8 ^ x2]]];
      xi ^= d[d[xi]];
    }
  }
  return true
};

var G = new Global();

AES.blockSize = 4 * 4;

AES.prototype.blockSize = AES.blockSize;

AES.keySize = 256 / 8;

AES.prototype.keySize = AES.keySize;

function bufferToArray (buf) {
  var len = buf.length / 4;
  var out = new Array(len);
  var i = -1;
  while (++i < len) {
    out[i] = buf.readUInt32BE(i * 4);
  }
  return out
}
function AES (key) {
  this._key = bufferToArray(key);
  this._doReset();
}

AES.prototype._doReset = function () {
  var invKsRow, keySize, keyWords, ksRow, ksRows, t;
  keyWords = this._key;
  keySize = keyWords.length;
  this._nRounds = keySize + 6;
  ksRows = (this._nRounds + 1) * 4;
  this._keySchedule = [];
  for (ksRow = 0; ksRow < ksRows; ksRow++) {
    this._keySchedule[ksRow] = ksRow < keySize ? keyWords[ksRow] : (t = this._keySchedule[ksRow - 1], (ksRow % keySize) === 0 ? (t = (t << 8) | (t >>> 24), t = (G.SBOX[t >>> 24] << 24) | (G.SBOX[(t >>> 16) & 0xff] << 16) | (G.SBOX[(t >>> 8) & 0xff] << 8) | G.SBOX[t & 0xff], t ^= G.RCON[(ksRow / keySize) | 0] << 24) : keySize > 6 && ksRow % keySize === 4 ? t = (G.SBOX[t >>> 24] << 24) | (G.SBOX[(t >>> 16) & 0xff] << 16) | (G.SBOX[(t >>> 8) & 0xff] << 8) | G.SBOX[t & 0xff] : void 0, this._keySchedule[ksRow - keySize] ^ t);
  }
  this._invKeySchedule = [];
  for (invKsRow = 0; invKsRow < ksRows; invKsRow++) {
    ksRow = ksRows - invKsRow;
    t = this._keySchedule[ksRow - (invKsRow % 4 ? 0 : 4)];
    this._invKeySchedule[invKsRow] = invKsRow < 4 || ksRow <= 4 ? t : G.INV_SUB_MIX[0][G.SBOX[t >>> 24]] ^ G.INV_SUB_MIX[1][G.SBOX[(t >>> 16) & 0xff]] ^ G.INV_SUB_MIX[2][G.SBOX[(t >>> 8) & 0xff]] ^ G.INV_SUB_MIX[3][G.SBOX[t & 0xff]];
  }
  return true
};

AES.prototype.encryptBlock = function (M) {
  M = bufferToArray(new Buffer$1(M));
  var out = this._doCryptBlock(M, this._keySchedule, G.SUB_MIX, G.SBOX);
  var buf = new Buffer$1(16);
  buf.writeUInt32BE(out[0], 0);
  buf.writeUInt32BE(out[1], 4);
  buf.writeUInt32BE(out[2], 8);
  buf.writeUInt32BE(out[3], 12);
  return buf
};

AES.prototype.decryptBlock = function (M) {
  M = bufferToArray(new Buffer$1(M));
  var temp = [M[3], M[1]];
  M[1] = temp[0];
  M[3] = temp[1];
  var out = this._doCryptBlock(M, this._invKeySchedule, G.INV_SUB_MIX, G.INV_SBOX);
  var buf = new Buffer$1(16);
  buf.writeUInt32BE(out[0], 0);
  buf.writeUInt32BE(out[3], 4);
  buf.writeUInt32BE(out[2], 8);
  buf.writeUInt32BE(out[1], 12);
  return buf
};

AES.prototype.scrub = function () {
  scrub_vec(this._keySchedule);
  scrub_vec(this._invKeySchedule);
  scrub_vec(this._key);
};

AES.prototype._doCryptBlock = function (M, keySchedule, SUB_MIX, SBOX) {
  var ksRow, s0, s1, s2, s3, t0, t1, t2, t3;

  s0 = M[0] ^ keySchedule[0];
  s1 = M[1] ^ keySchedule[1];
  s2 = M[2] ^ keySchedule[2];
  s3 = M[3] ^ keySchedule[3];
  ksRow = 4;
  for (var round = 1; round < this._nRounds; round++) {
    t0 = SUB_MIX[0][s0 >>> 24] ^ SUB_MIX[1][(s1 >>> 16) & 0xff] ^ SUB_MIX[2][(s2 >>> 8) & 0xff] ^ SUB_MIX[3][s3 & 0xff] ^ keySchedule[ksRow++];
    t1 = SUB_MIX[0][s1 >>> 24] ^ SUB_MIX[1][(s2 >>> 16) & 0xff] ^ SUB_MIX[2][(s3 >>> 8) & 0xff] ^ SUB_MIX[3][s0 & 0xff] ^ keySchedule[ksRow++];
    t2 = SUB_MIX[0][s2 >>> 24] ^ SUB_MIX[1][(s3 >>> 16) & 0xff] ^ SUB_MIX[2][(s0 >>> 8) & 0xff] ^ SUB_MIX[3][s1 & 0xff] ^ keySchedule[ksRow++];
    t3 = SUB_MIX[0][s3 >>> 24] ^ SUB_MIX[1][(s0 >>> 16) & 0xff] ^ SUB_MIX[2][(s1 >>> 8) & 0xff] ^ SUB_MIX[3][s2 & 0xff] ^ keySchedule[ksRow++];
    s0 = t0;
    s1 = t1;
    s2 = t2;
    s3 = t3;
  }
  t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
  t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
  t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
  t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];
  return [
    fixup_uint32(t0),
    fixup_uint32(t1),
    fixup_uint32(t2),
    fixup_uint32(t3)
  ]
};

var AES_1 = AES;

var aes = {
	AES: AES_1
};

var modes = createCommonjsModule(function (module, exports) {
exports['aes-128-ecb'] = {
  cipher: 'AES',
  key: 128,
  iv: 0,
  mode: 'ECB',
  type: 'block'
};
exports['aes-192-ecb'] = {
  cipher: 'AES',
  key: 192,
  iv: 0,
  mode: 'ECB',
  type: 'block'
};
exports['aes-256-ecb'] = {
  cipher: 'AES',
  key: 256,
  iv: 0,
  mode: 'ECB',
  type: 'block'
};
exports['aes-128-cbc'] = {
  cipher: 'AES',
  key: 128,
  iv: 16,
  mode: 'CBC',
  type: 'block'
};
exports['aes-192-cbc'] = {
  cipher: 'AES',
  key: 192,
  iv: 16,
  mode: 'CBC',
  type: 'block'
};
exports['aes-256-cbc'] = {
  cipher: 'AES',
  key: 256,
  iv: 16,
  mode: 'CBC',
  type: 'block'
};
exports['aes128'] = exports['aes-128-cbc'];
exports['aes192'] = exports['aes-192-cbc'];
exports['aes256'] = exports['aes-256-cbc'];
exports['aes-128-cfb'] = {
  cipher: 'AES',
  key: 128,
  iv: 16,
  mode: 'CFB',
  type: 'stream'
};
exports['aes-192-cfb'] = {
  cipher: 'AES',
  key: 192,
  iv: 16,
  mode: 'CFB',
  type: 'stream'
};
exports['aes-256-cfb'] = {
  cipher: 'AES',
  key: 256,
  iv: 16,
  mode: 'CFB',
  type: 'stream'
};
exports['aes-128-cfb8'] = {
  cipher: 'AES',
  key: 128,
  iv: 16,
  mode: 'CFB8',
  type: 'stream'
};
exports['aes-192-cfb8'] = {
  cipher: 'AES',
  key: 192,
  iv: 16,
  mode: 'CFB8',
  type: 'stream'
};
exports['aes-256-cfb8'] = {
  cipher: 'AES',
  key: 256,
  iv: 16,
  mode: 'CFB8',
  type: 'stream'
};
exports['aes-128-cfb1'] = {
  cipher: 'AES',
  key: 128,
  iv: 16,
  mode: 'CFB1',
  type: 'stream'
};
exports['aes-192-cfb1'] = {
  cipher: 'AES',
  key: 192,
  iv: 16,
  mode: 'CFB1',
  type: 'stream'
};
exports['aes-256-cfb1'] = {
  cipher: 'AES',
  key: 256,
  iv: 16,
  mode: 'CFB1',
  type: 'stream'
};
exports['aes-128-ofb'] = {
  cipher: 'AES',
  key: 128,
  iv: 16,
  mode: 'OFB',
  type: 'stream'
};
exports['aes-192-ofb'] = {
  cipher: 'AES',
  key: 192,
  iv: 16,
  mode: 'OFB',
  type: 'stream'
};
exports['aes-256-ofb'] = {
  cipher: 'AES',
  key: 256,
  iv: 16,
  mode: 'OFB',
  type: 'stream'
};
exports['aes-128-ctr'] = {
  cipher: 'AES',
  key: 128,
  iv: 16,
  mode: 'CTR',
  type: 'stream'
};
exports['aes-192-ctr'] = {
  cipher: 'AES',
  key: 192,
  iv: 16,
  mode: 'CTR',
  type: 'stream'
};
exports['aes-256-ctr'] = {
  cipher: 'AES',
  key: 256,
  iv: 16,
  mode: 'CTR',
  type: 'stream'
};
exports['aes-128-gcm'] = {
  cipher: 'AES',
  key: 128,
  iv: 12,
  mode: 'GCM',
  type: 'auth'
};
exports['aes-192-gcm'] = {
  cipher: 'AES',
  key: 192,
  iv: 12,
  mode: 'GCM',
  type: 'auth'
};
exports['aes-256-gcm'] = {
  cipher: 'AES',
  key: 256,
  iv: 12,
  mode: 'GCM',
  type: 'auth'
};
});

var Buffer = safeBuffer.Buffer;


/* eslint-disable camelcase */
function EVP_BytesToKey (password, salt, keyBits, ivLen) {
  if (!Buffer.isBuffer(password)) password = Buffer.from(password, 'binary');
  if (salt) {
    if (!Buffer.isBuffer(salt)) salt = Buffer.from(salt, 'binary');
    if (salt.length !== 8) throw new RangeError('salt should be Buffer with 8 byte length')
  }

  var keyLen = keyBits / 8;
  var key = Buffer.alloc(keyLen);
  var iv = Buffer.alloc(ivLen || 0);
  var tmp = Buffer.alloc(0);

  while (keyLen > 0 || ivLen > 0) {
    var hash = new md5_js();
    hash.update(tmp);
    hash.update(password);
    if (salt) hash.update(salt);
    tmp = hash.digest();

    var used = 0;

    if (keyLen > 0) {
      var keyStart = key.length - keyLen;
      used = Math.min(keyLen, tmp.length);
      tmp.copy(key, keyStart, 0, used);
      keyLen -= used;
    }

    if (used < tmp.length && ivLen > 0) {
      var ivStart = iv.length - ivLen;
      var length = Math.min(ivLen, tmp.length - used);
      tmp.copy(iv, ivStart, used, used + length);
      ivLen -= length;
    }
  }

  tmp.fill(0);
  return { key: key, iv: iv }
}

var evp_bytestokey = EVP_BytesToKey;

inherits_browser(StreamCipher, cipherBase);
var streamCipher = StreamCipher;
function StreamCipher (mode, key, iv, decrypt) {
  if (!(this instanceof StreamCipher)) {
    return new StreamCipher(mode, key, iv)
  }
  cipherBase.call(this);
  this._cipher = new aes.AES(key);
  this._prev = new Buffer$1(iv.length);
  this._cache = new Buffer$1('');
  this._secCache = new Buffer$1('');
  this._decrypt = decrypt;
  iv.copy(this._prev);
  this._mode = mode;
}
StreamCipher.prototype._update = function (chunk) {
  return this._mode.encrypt(this, chunk, this._decrypt)
};
StreamCipher.prototype._final = function () {
  this._cipher.scrub();
};

var zeros = new Buffer$1(16);
zeros.fill(0);
var ghash = GHASH;
function GHASH (key) {
  this.h = key;
  this.state = new Buffer$1(16);
  this.state.fill(0);
  this.cache = new Buffer$1('');
}
// from http://bitwiseshiftleft.github.io/sjcl/doc/symbols/src/core_gcm.js.html
// by Juho Vähä-Herttua
GHASH.prototype.ghash = function (block) {
  var i = -1;
  while (++i < block.length) {
    this.state[i] ^= block[i];
  }
  this._multiply();
};

GHASH.prototype._multiply = function () {
  var Vi = toArray(this.h);
  var Zi = [0, 0, 0, 0];
  var j, xi, lsb_Vi;
  var i = -1;
  while (++i < 128) {
    xi = (this.state[~~(i / 8)] & (1 << (7 - i % 8))) !== 0;
    if (xi) {
      // Z_i+1 = Z_i ^ V_i
      Zi = xor(Zi, Vi);
    }

    // Store the value of LSB(V_i)
    lsb_Vi = (Vi[3] & 1) !== 0;

    // V_i+1 = V_i >> 1
    for (j = 3; j > 0; j--) {
      Vi[j] = (Vi[j] >>> 1) | ((Vi[j - 1] & 1) << 31);
    }
    Vi[0] = Vi[0] >>> 1;

    // If LSB(V_i) is 1, V_i+1 = (V_i >> 1) ^ R
    if (lsb_Vi) {
      Vi[0] = Vi[0] ^ (0xe1 << 24);
    }
  }
  this.state = fromArray(Zi);
};
GHASH.prototype.update = function (buf) {
  this.cache = Buffer$1.concat([this.cache, buf]);
  var chunk;
  while (this.cache.length >= 16) {
    chunk = this.cache.slice(0, 16);
    this.cache = this.cache.slice(16);
    this.ghash(chunk);
  }
};
GHASH.prototype.final = function (abl, bl) {
  if (this.cache.length) {
    this.ghash(Buffer$1.concat([this.cache, zeros], 16));
  }
  this.ghash(fromArray([
    0, abl,
    0, bl
  ]));
  return this.state
};

function toArray (buf) {
  return [
    buf.readUInt32BE(0),
    buf.readUInt32BE(4),
    buf.readUInt32BE(8),
    buf.readUInt32BE(12)
  ]
}
function fromArray (out) {
  out = out.map(fixup_uint32$1);
  var buf = new Buffer$1(16);
  buf.writeUInt32BE(out[0], 0);
  buf.writeUInt32BE(out[1], 4);
  buf.writeUInt32BE(out[2], 8);
  buf.writeUInt32BE(out[3], 12);
  return buf
}
var uint_max$1 = Math.pow(2, 32);
function fixup_uint32$1 (x) {
  var ret, x_pos;
  ret = x > uint_max$1 || x < 0 ? (x_pos = Math.abs(x) % uint_max$1, x < 0 ? uint_max$1 - x_pos : x_pos) : x;
  return ret
}
function xor (a, b) {
  return [
    a[0] ^ b[0],
    a[1] ^ b[1],
    a[2] ^ b[2],
    a[3] ^ b[3]
  ]
}

var bufferXor = function xor (a, b) {
  var length = Math.min(a.length, b.length);
  var buffer = new Buffer$1(length);

  for (var i = 0; i < length; ++i) {
    buffer[i] = a[i] ^ b[i];
  }

  return buffer
};

inherits_browser(StreamCipher$1, cipherBase);
var authCipher = StreamCipher$1;

function StreamCipher$1 (mode, key, iv, decrypt) {
  if (!(this instanceof StreamCipher$1)) {
    return new StreamCipher$1(mode, key, iv)
  }
  cipherBase.call(this);
  this._finID = Buffer$1.concat([iv, new Buffer$1([0, 0, 0, 1])]);
  iv = Buffer$1.concat([iv, new Buffer$1([0, 0, 0, 2])]);
  this._cipher = new aes.AES(key);
  this._prev = new Buffer$1(iv.length);
  this._cache = new Buffer$1('');
  this._secCache = new Buffer$1('');
  this._decrypt = decrypt;
  this._alen = 0;
  this._len = 0;
  iv.copy(this._prev);
  this._mode = mode;
  var h = new Buffer$1(4);
  h.fill(0);
  this._ghash = new ghash(this._cipher.encryptBlock(h));
  this._authTag = null;
  this._called = false;
}
StreamCipher$1.prototype._update = function (chunk) {
  if (!this._called && this._alen) {
    var rump = 16 - (this._alen % 16);
    if (rump < 16) {
      rump = new Buffer$1(rump);
      rump.fill(0);
      this._ghash.update(rump);
    }
  }
  this._called = true;
  var out = this._mode.encrypt(this, chunk);
  if (this._decrypt) {
    this._ghash.update(chunk);
  } else {
    this._ghash.update(out);
  }
  this._len += chunk.length;
  return out
};
StreamCipher$1.prototype._final = function () {
  if (this._decrypt && !this._authTag) {
    throw new Error('Unsupported state or unable to authenticate data')
  }
  var tag = bufferXor(this._ghash.final(this._alen * 8, this._len * 8), this._cipher.encryptBlock(this._finID));
  if (this._decrypt) {
    if (xorTest(tag, this._authTag)) {
      throw new Error('Unsupported state or unable to authenticate data')
    }
  } else {
    this._authTag = tag;
  }
  this._cipher.scrub();
};
StreamCipher$1.prototype.getAuthTag = function getAuthTag () {
  if (!this._decrypt && Buffer$1.isBuffer(this._authTag)) {
    return this._authTag
  } else {
    throw new Error('Attempting to get auth tag in unsupported state')
  }
};
StreamCipher$1.prototype.setAuthTag = function setAuthTag (tag) {
  if (this._decrypt) {
    this._authTag = tag;
  } else {
    throw new Error('Attempting to set auth tag in unsupported state')
  }
};
StreamCipher$1.prototype.setAAD = function setAAD (buf) {
  if (!this._called) {
    this._ghash.update(buf);
    this._alen += buf.length;
  } else {
    throw new Error('Attempting to set AAD in unsupported state')
  }
};
function xorTest (a, b) {
  var out = 0;
  if (a.length !== b.length) {
    out++;
  }
  var len = Math.min(a.length, b.length);
  var i = -1;
  while (++i < len) {
    out += (a[i] ^ b[i]);
  }
  return out
}

var encrypt = function (self, block) {
  return self._cipher.encryptBlock(block)
};
var decrypt = function (self, block) {
  return self._cipher.decryptBlock(block)
};

var ecb = {
	encrypt: encrypt,
	decrypt: decrypt
};

var encrypt$1 = function (self, block) {
  var data = bufferXor(block, self._prev);

  self._prev = self._cipher.encryptBlock(data);
  return self._prev
};

var decrypt$1 = function (self, block) {
  var pad = self._prev;

  self._prev = block;
  var out = self._cipher.decryptBlock(block);

  return bufferXor(out, pad)
};

var cbc = {
	encrypt: encrypt$1,
	decrypt: decrypt$1
};

var encrypt$2 = function (self, data, decrypt) {
  var out = new Buffer$1('');
  var len;

  while (data.length) {
    if (self._cache.length === 0) {
      self._cache = self._cipher.encryptBlock(self._prev);
      self._prev = new Buffer$1('');
    }

    if (self._cache.length <= data.length) {
      len = self._cache.length;
      out = Buffer$1.concat([out, encryptStart(self, data.slice(0, len), decrypt)]);
      data = data.slice(len);
    } else {
      out = Buffer$1.concat([out, encryptStart(self, data, decrypt)]);
      break
    }
  }

  return out
};
function encryptStart (self, data, decrypt) {
  var len = data.length;
  var out = bufferXor(data, self._cache);
  self._cache = self._cache.slice(len);
  self._prev = Buffer$1.concat([self._prev, decrypt ? data : out]);
  return out
}

var cfb = {
	encrypt: encrypt$2
};

function encryptByte (self, byteParam, decrypt) {
  var pad = self._cipher.encryptBlock(self._prev);
  var out = pad[0] ^ byteParam;
  self._prev = Buffer$1.concat([self._prev.slice(1), new Buffer$1([decrypt ? byteParam : out])]);
  return out
}
var encrypt$3 = function (self, chunk, decrypt) {
  var len = chunk.length;
  var out = new Buffer$1(len);
  var i = -1;
  while (++i < len) {
    out[i] = encryptByte(self, chunk[i], decrypt);
  }
  return out
};

var cfb8 = {
	encrypt: encrypt$3
};

function encryptByte$1 (self, byteParam, decrypt) {
  var pad;
  var i = -1;
  var len = 8;
  var out = 0;
  var bit, value;
  while (++i < len) {
    pad = self._cipher.encryptBlock(self._prev);
    bit = (byteParam & (1 << (7 - i))) ? 0x80 : 0;
    value = pad[0] ^ bit;
    out += ((value & 0x80) >> (i % 8));
    self._prev = shiftIn(self._prev, decrypt ? bit : value);
  }
  return out
}
var encrypt$4 = function (self, chunk, decrypt) {
  var len = chunk.length;
  var out = new Buffer$1(len);
  var i = -1;
  while (++i < len) {
    out[i] = encryptByte$1(self, chunk[i], decrypt);
  }
  return out
};
function shiftIn (buffer, value) {
  var len = buffer.length;
  var i = -1;
  var out = new Buffer$1(buffer.length);
  buffer = Buffer$1.concat([buffer, new Buffer$1([value])]);
  while (++i < len) {
    out[i] = buffer[i] << 1 | buffer[i + 1] >> (7);
  }
  return out
}

var cfb1 = {
	encrypt: encrypt$4
};

function getBlock (self) {
  self._prev = self._cipher.encryptBlock(self._prev);
  return self._prev
}

var encrypt$5 = function (self, chunk) {
  while (self._cache.length < chunk.length) {
    self._cache = Buffer$1.concat([self._cache, getBlock(self)]);
  }

  var pad = self._cache.slice(0, chunk.length);
  self._cache = self._cache.slice(chunk.length);
  return bufferXor(chunk, pad)
};

var ofb = {
	encrypt: encrypt$5
};

function incr32 (iv) {
  var len = iv.length;
  var item;
  while (len--) {
    item = iv.readUInt8(len);
    if (item === 255) {
      iv.writeUInt8(0, len);
    } else {
      item++;
      iv.writeUInt8(item, len);
      break
    }
  }
}

function getBlock$1 (self) {
  var out = self._cipher.encryptBlock(self._prev);
  incr32(self._prev);
  return out
}

var encrypt$6 = function (self, chunk) {
  while (self._cache.length < chunk.length) {
    self._cache = Buffer$1.concat([self._cache, getBlock$1(self)]);
  }
  var pad = self._cache.slice(0, chunk.length);
  self._cache = self._cache.slice(chunk.length);
  return bufferXor(chunk, pad)
};

var ctr = {
	encrypt: encrypt$6
};

inherits_browser(Cipher, cipherBase);
function Cipher (mode, key, iv) {
  if (!(this instanceof Cipher)) {
    return new Cipher(mode, key, iv)
  }
  cipherBase.call(this);
  this._cache = new Splitter();
  this._cipher = new aes.AES(key);
  this._prev = new Buffer$1(iv.length);
  iv.copy(this._prev);
  this._mode = mode;
  this._autopadding = true;
}
Cipher.prototype._update = function (data) {
  this._cache.add(data);
  var chunk;
  var thing;
  var out = [];
  while ((chunk = this._cache.get())) {
    thing = this._mode.encrypt(this, chunk);
    out.push(thing);
  }
  return Buffer$1.concat(out)
};
Cipher.prototype._final = function () {
  var chunk = this._cache.flush();
  if (this._autopadding) {
    chunk = this._mode.encrypt(this, chunk);
    this._cipher.scrub();
    return chunk
  } else if (chunk.toString('hex') !== '10101010101010101010101010101010') {
    this._cipher.scrub();
    throw new Error('data not multiple of block length')
  }
};
Cipher.prototype.setAutoPadding = function (setTo) {
  this._autopadding = !!setTo;
  return this
};

function Splitter () {
  if (!(this instanceof Splitter)) {
    return new Splitter()
  }
  this.cache = new Buffer$1('');
}
Splitter.prototype.add = function (data) {
  this.cache = Buffer$1.concat([this.cache, data]);
};

Splitter.prototype.get = function () {
  if (this.cache.length > 15) {
    var out = this.cache.slice(0, 16);
    this.cache = this.cache.slice(16);
    return out
  }
  return null
};
Splitter.prototype.flush = function () {
  var len = 16 - this.cache.length;
  var padBuff = new Buffer$1(len);

  var i = -1;
  while (++i < len) {
    padBuff.writeUInt8(len, i);
  }
  var out = Buffer$1.concat([this.cache, padBuff]);
  return out
};
var modelist = {
  ECB: ecb,
  CBC: cbc,
  CFB: cfb,
  CFB8: cfb8,
  CFB1: cfb1,
  OFB: ofb,
  CTR: ctr,
  GCM: ctr
};

function createCipheriv (suite, password, iv) {
  var config = modes[suite.toLowerCase()];
  if (!config) {
    throw new TypeError('invalid suite type')
  }
  if (typeof iv === 'string') {
    iv = new Buffer$1(iv);
  }
  if (typeof password === 'string') {
    password = new Buffer$1(password);
  }
  if (password.length !== config.key / 8) {
    throw new TypeError('invalid key length ' + password.length)
  }
  if (iv.length !== config.iv) {
    throw new TypeError('invalid iv length ' + iv.length)
  }
  if (config.type === 'stream') {
    return new streamCipher(modelist[config.mode], password, iv)
  } else if (config.type === 'auth') {
    return new authCipher(modelist[config.mode], password, iv)
  }
  return new Cipher(modelist[config.mode], password, iv)
}
function createCipher (suite, password) {
  var config = modes[suite.toLowerCase()];
  if (!config) {
    throw new TypeError('invalid suite type')
  }
  var keys = evp_bytestokey(password, false, config.key, config.iv);
  return createCipheriv(suite, keys.key, keys.iv)
}

var createCipheriv_1 = createCipheriv;
var createCipher_1 = createCipher;

var encrypter = {
	createCipheriv: createCipheriv_1,
	createCipher: createCipher_1
};

inherits_browser(Decipher, cipherBase);
function Decipher (mode, key, iv) {
  if (!(this instanceof Decipher)) {
    return new Decipher(mode, key, iv)
  }
  cipherBase.call(this);
  this._cache = new Splitter$1();
  this._last = void 0;
  this._cipher = new aes.AES(key);
  this._prev = new Buffer$1(iv.length);
  iv.copy(this._prev);
  this._mode = mode;
  this._autopadding = true;
}
Decipher.prototype._update = function (data) {
  this._cache.add(data);
  var chunk;
  var thing;
  var out = [];
  while ((chunk = this._cache.get(this._autopadding))) {
    thing = this._mode.decrypt(this, chunk);
    out.push(thing);
  }
  return Buffer$1.concat(out)
};
Decipher.prototype._final = function () {
  var chunk = this._cache.flush();
  if (this._autopadding) {
    return unpad(this._mode.decrypt(this, chunk))
  } else if (chunk) {
    throw new Error('data not multiple of block length')
  }
};
Decipher.prototype.setAutoPadding = function (setTo) {
  this._autopadding = !!setTo;
  return this
};
function Splitter$1 () {
  if (!(this instanceof Splitter$1)) {
    return new Splitter$1()
  }
  this.cache = new Buffer$1('');
}
Splitter$1.prototype.add = function (data) {
  this.cache = Buffer$1.concat([this.cache, data]);
};

Splitter$1.prototype.get = function (autoPadding) {
  var out;
  if (autoPadding) {
    if (this.cache.length > 16) {
      out = this.cache.slice(0, 16);
      this.cache = this.cache.slice(16);
      return out
    }
  } else {
    if (this.cache.length >= 16) {
      out = this.cache.slice(0, 16);
      this.cache = this.cache.slice(16);
      return out
    }
  }
  return null
};
Splitter$1.prototype.flush = function () {
  if (this.cache.length) {
    return this.cache
  }
};
function unpad (last) {
  var padded = last[15];
  var i = -1;
  while (++i < padded) {
    if (last[(i + (16 - padded))] !== padded) {
      throw new Error('unable to decrypt data')
    }
  }
  if (padded === 16) {
    return
  }
  return last.slice(0, 16 - padded)
}

var modelist$1 = {
  ECB: ecb,
  CBC: cbc,
  CFB: cfb,
  CFB8: cfb8,
  CFB1: cfb1,
  OFB: ofb,
  CTR: ctr,
  GCM: ctr
};

function createDecipheriv (suite, password, iv) {
  var config = modes[suite.toLowerCase()];
  if (!config) {
    throw new TypeError('invalid suite type')
  }
  if (typeof iv === 'string') {
    iv = new Buffer$1(iv);
  }
  if (typeof password === 'string') {
    password = new Buffer$1(password);
  }
  if (password.length !== config.key / 8) {
    throw new TypeError('invalid key length ' + password.length)
  }
  if (iv.length !== config.iv) {
    throw new TypeError('invalid iv length ' + iv.length)
  }
  if (config.type === 'stream') {
    return new streamCipher(modelist$1[config.mode], password, iv, true)
  } else if (config.type === 'auth') {
    return new authCipher(modelist$1[config.mode], password, iv, true)
  }
  return new Decipher(modelist$1[config.mode], password, iv)
}

function createDecipher (suite, password) {
  var config = modes[suite.toLowerCase()];
  if (!config) {
    throw new TypeError('invalid suite type')
  }
  var keys = evp_bytestokey(password, false, config.key, config.iv);
  return createDecipheriv(suite, keys.key, keys.iv)
}
var createDecipher_1 = createDecipher;
var createDecipheriv_1 = createDecipheriv;

var decrypter = {
	createDecipher: createDecipher_1,
	createDecipheriv: createDecipheriv_1
};

var browser = createCommonjsModule(function (module, exports) {
exports.createCipher = exports.Cipher = encrypter.createCipher;
exports.createCipheriv = exports.Cipheriv = encrypter.createCipheriv;

exports.createDecipher = exports.Decipher = decrypter.createDecipher;
exports.createDecipheriv = exports.Decipheriv = decrypter.createDecipheriv;

function getCiphers () {
  return Object.keys(modes)
}
exports.listCiphers = exports.getCiphers = getCiphers;
});

export default browser;
