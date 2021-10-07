import './common/_commonjsHelpers-db517561.js';
import './common/buffer-es6-e6024076.js';
import { s as safeBuffer } from './common/index-7e6eb98b.js';
import './common/process-e9e98960.js';
import './common/util-8183cd0e.js';
import { i as inherits_browser, c as cipherBase } from './common/index-681c3834.js';
import { m as md5_js } from './common/index-c10fc565.js';
import { r as ripemd160, s as sha_js } from './common/index-43edf2d0.js';

var Buffer = safeBuffer.Buffer;



var ZEROS = Buffer.alloc(128);
var blocksize = 64;

function Hmac (alg, key) {
  cipherBase.call(this, 'digest');
  if (typeof key === 'string') {
    key = Buffer.from(key);
  }

  this._alg = alg;
  this._key = key;

  if (key.length > blocksize) {
    key = alg(key);
  } else if (key.length < blocksize) {
    key = Buffer.concat([key, ZEROS], blocksize);
  }

  var ipad = this._ipad = Buffer.allocUnsafe(blocksize);
  var opad = this._opad = Buffer.allocUnsafe(blocksize);

  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36;
    opad[i] = key[i] ^ 0x5C;
  }

  this._hash = [ipad];
}

inherits_browser(Hmac, cipherBase);

Hmac.prototype._update = function (data) {
  this._hash.push(data);
};

Hmac.prototype._final = function () {
  var h = this._alg(Buffer.concat(this._hash));
  return this._alg(Buffer.concat([this._opad, h]))
};
var legacy = Hmac;

var md5 = function (buffer) {
  return new md5_js().update(buffer).digest()
};

var Buffer$1 = safeBuffer.Buffer;





var ZEROS$1 = Buffer$1.alloc(128);

function Hmac$1 (alg, key) {
  cipherBase.call(this, 'digest');
  if (typeof key === 'string') {
    key = Buffer$1.from(key);
  }

  var blocksize = (alg === 'sha512' || alg === 'sha384') ? 128 : 64;

  this._alg = alg;
  this._key = key;
  if (key.length > blocksize) {
    var hash = alg === 'rmd160' ? new ripemd160() : sha_js(alg);
    key = hash.update(key).digest();
  } else if (key.length < blocksize) {
    key = Buffer$1.concat([key, ZEROS$1], blocksize);
  }

  var ipad = this._ipad = Buffer$1.allocUnsafe(blocksize);
  var opad = this._opad = Buffer$1.allocUnsafe(blocksize);

  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36;
    opad[i] = key[i] ^ 0x5C;
  }
  this._hash = alg === 'rmd160' ? new ripemd160() : sha_js(alg);
  this._hash.update(ipad);
}

inherits_browser(Hmac$1, cipherBase);

Hmac$1.prototype._update = function (data) {
  this._hash.update(data);
};

Hmac$1.prototype._final = function () {
  var h = this._hash.digest();
  var hash = this._alg === 'rmd160' ? new ripemd160() : sha_js(this._alg);
  return hash.update(this._opad).update(h).digest()
};

var browser = function createHmac (alg, key) {
  alg = alg.toLowerCase();
  if (alg === 'rmd160' || alg === 'ripemd160') {
    return new Hmac$1('rmd160', key)
  }
  if (alg === 'md5') {
    return new legacy(md5, key)
  }
  return new Hmac$1(alg, key)
};

export default browser;
