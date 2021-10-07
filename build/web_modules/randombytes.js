import { c as createCommonjsModule, b as commonjsGlobal } from './common/_commonjsHelpers-db517561.js';
import './common/buffer-es6-e6024076.js';
import { s as safeBuffer } from './common/index-7e6eb98b.js';
import { p as process } from './common/process-e9e98960.js';

var browser = createCommonjsModule(function (module) {

function oldBrowser () {
  throw new Error('secure random number generation not supported by this browser\nuse chrome, FireFox or Internet Explorer 11')
}

var Buffer = safeBuffer.Buffer;
var crypto = commonjsGlobal.crypto || commonjsGlobal.msCrypto;

if (crypto && crypto.getRandomValues) {
  module.exports = randomBytes;
} else {
  module.exports = oldBrowser;
}

function randomBytes (size, cb) {
  // phantomjs needs to throw
  if (size > 65536) throw new Error('requested too many random bytes')
  // in case browserify  isn't using the Uint8Array version
  var rawBytes = new commonjsGlobal.Uint8Array(size);

  // This will not work in older browsers.
  // See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
  if (size > 0) {  // getRandomValues fails on IE if size == 0
    crypto.getRandomValues(rawBytes);
  }

  // XXX: phantomjs doesn't like a buffer being passed here
  var bytes = Buffer.from(rawBytes.buffer);

  if (typeof cb === 'function') {
    return process.nextTick(function () {
      cb(null, bytes);
    })
  }

  return bytes
}
});

export default browser;
