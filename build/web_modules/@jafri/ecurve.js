import '../common/_commonjsHelpers-db517561.js';
import '../common/buffer-es6-e6024076.js';
import { s as safeBuffer } from '../common/index-7e6eb98b.js';
import { l as lib$1 } from '../common/index-382a747d.js';
import '../common/process-e9e98960.js';
import '../common/util-8183cd0e.js';

const assert = (isTrue, error) => {
    if (isTrue) {
        return
    } else {
        throw new Error(error)
    }
};

const assertEqual = (item1, item2, error) => {
    if (item1 == item2) {
        return
    } else {
        throw new Error(error)
    }
};

const assertStrictEqual = (item1, item2, error) => {
    if (item1 === item2) {
        return
    } else {
        throw new Error(error)
    }
};

const assertNotStrictEqual = (item1, item2, error) => {
    if (item1 !== item2) {
        return
    } else {
        throw new Error(error)
    }
};

var assert_1 = {
    assert,
    assertEqual,
    assertStrictEqual,
    assertNotStrictEqual
};

/* Parts of this software are derivative works of Tom Wu `ec.js` (as part of JSBN).
 * See http://www-cs-students.stanford.edu/~tjw/jsbn/ec.js
 *
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */

var {assert: assert$1, assertEqual: assertEqual$1, assertNotStrictEqual: assertNotStrictEqual$1} = assert_1;
var Buffer = safeBuffer.Buffer;


var THREE = lib$1.valueOf(3);

function Point (curve, x, y, z) {
  assertNotStrictEqual$1(z, undefined, 'Missing Z coordinate');

  this.curve = curve;
  this.x = x;
  this.y = y;
  this.z = z;
  this._zInv = null;

  this.compressed = true;
}

Object.defineProperty(Point.prototype, 'zInv', {
  get: function () {
    if (this._zInv === null) {
      this._zInv = this.z.modInverse(this.curve.p);
    }

    return this._zInv
  }
});

Object.defineProperty(Point.prototype, 'affineX', {
  get: function () {
    return this.x.multiply(this.zInv).mod(this.curve.p)
  }
});

Object.defineProperty(Point.prototype, 'affineY', {
  get: function () {
    return this.y.multiply(this.zInv).mod(this.curve.p)
  }
});

Point.fromAffine = function (curve, x, y) {
  return new Point(curve, x, y, lib$1.ONE)
};

Point.prototype.equals = function (other) {
  if (other === this) return true
  if (this.curve.isInfinity(this)) return this.curve.isInfinity(other)
  if (this.curve.isInfinity(other)) return this.curve.isInfinity(this)

  // u = Y2 * Z1 - Y1 * Z2
  var u = other.y.multiply(this.z).subtract(this.y.multiply(other.z)).mod(this.curve.p);

  if (u.signum() !== 0) return false

  // v = X2 * Z1 - X1 * Z2
  var v = other.x.multiply(this.z).subtract(this.x.multiply(other.z)).mod(this.curve.p);

  return v.signum() === 0
};

Point.prototype.negate = function () {
  var y = this.curve.p.subtract(this.y);

  return new Point(this.curve, this.x, y, this.z)
};

Point.prototype.add = function (b) {
  if (this.curve.isInfinity(this)) return b
  if (this.curve.isInfinity(b)) return this

  var x1 = this.x;
  var y1 = this.y;
  var x2 = b.x;
  var y2 = b.y;

  // u = Y2 * Z1 - Y1 * Z2
  var u = y2.multiply(this.z).subtract(y1.multiply(b.z)).mod(this.curve.p);
  // v = X2 * Z1 - X1 * Z2
  var v = x2.multiply(this.z).subtract(x1.multiply(b.z)).mod(this.curve.p);

  if (v.signum() === 0) {
    if (u.signum() === 0) {
      return this.twice() // this == b, so double
    }

    return this.curve.infinity // this = -b, so infinity
  }

  var v2 = v.square();
  var v3 = v2.multiply(v);
  var x1v2 = x1.multiply(v2);
  var zu2 = u.square().multiply(this.z);

  // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
  var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.p);
  // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
  var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.p);
  // z3 = v^3 * z1 * z2
  var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.p);

  return new Point(this.curve, x3, y3, z3)
};

Point.prototype.twice = function () {
  if (this.curve.isInfinity(this)) return this
  if (this.y.signum() === 0) return this.curve.infinity

  var x1 = this.x;
  var y1 = this.y;

  var y1z1 = y1.multiply(this.z).mod(this.curve.p);
  var y1sqz1 = y1z1.multiply(y1).mod(this.curve.p);
  var a = this.curve.a;

  // w = 3 * x1^2 + a * z1^2
  var w = x1.square().multiply(THREE);

  if (a.signum() !== 0) {
    w = w.add(this.z.square().multiply(a));
  }

  w = w.mod(this.curve.p);
  // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
  var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.p);
  // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
  var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.pow(3)).mod(this.curve.p);
  // z3 = 8 * (y1 * z1)^3
  var z3 = y1z1.pow(3).shiftLeft(3).mod(this.curve.p);

  return new Point(this.curve, x3, y3, z3)
};

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
Point.prototype.multiply = function (k) {
  if (this.curve.isInfinity(this)) return this
  if (k.signum() === 0) return this.curve.infinity

  var e = k;
  var h = e.multiply(THREE);

  var neg = this.negate();
  var R = this;

  for (var i = h.bitLength() - 2; i > 0; --i) {
    var hBit = h.testBit(i);
    var eBit = e.testBit(i);

    R = R.twice();

    if (hBit !== eBit) {
      R = R.add(hBit ? this : neg);
    }
  }

  return R
};

// Compute this*j + x*k (simultaneous multiplication)
Point.prototype.multiplyTwo = function (j, x, k) {
  var i = Math.max(j.bitLength(), k.bitLength()) - 1;
  var R = this.curve.infinity;
  var both = this.add(x);

  while (i >= 0) {
    var jBit = j.testBit(i);
    var kBit = k.testBit(i);

    R = R.twice();

    if (jBit) {
      if (kBit) {
        R = R.add(both);
      } else {
        R = R.add(this);
      }
    } else if (kBit) {
      R = R.add(x);
    }
    --i;
  }

  return R
};

Point.prototype.getEncoded = function (compressed) {
  if (compressed == null) compressed = this.compressed;
  if (this.curve.isInfinity(this)) return Buffer.alloc(1, 0) // Infinity point encoded is simply '00'

  var x = this.affineX;
  var y = this.affineY;
  var byteLength = this.curve.pLength;
  var buffer;

  // 0x02/0x03 | X
  if (compressed) {
    buffer = Buffer.allocUnsafe(1 + byteLength);
    buffer.writeUInt8(y.isEven() ? 0x02 : 0x03, 0);

  // 0x04 | X | Y
  } else {
    buffer = Buffer.allocUnsafe(1 + byteLength + byteLength);
    buffer.writeUInt8(0x04, 0);

    y.toBuffer(byteLength).copy(buffer, 1 + byteLength);
  }

  x.toBuffer(byteLength).copy(buffer, 1);

  return buffer
};

Point.decodeFrom = function (curve, buffer) {
  var type = buffer.readUInt8(0);
  var compressed = (type !== 4);

  var byteLength = Math.floor((curve.p.bitLength() + 7) / 8);
  var x = lib$1.fromBuffer(buffer.slice(1, 1 + byteLength));

  var Q;
  if (compressed) {
    assertEqual$1(buffer.length, byteLength + 1, 'Invalid sequence length');
    assert$1(type === 0x02 || type === 0x03, 'Invalid sequence tag');

    var isOdd = (type === 0x03);
    Q = curve.pointFromX(isOdd, x);
  } else {
    assertEqual$1(buffer.length, 1 + byteLength + byteLength, 'Invalid sequence length');

    var y = lib$1.fromBuffer(buffer.slice(1 + byteLength));
    Q = Point.fromAffine(curve, x, y);
  }

  Q.compressed = compressed;
  return Q
};

Point.prototype.toString = function () {
  if (this.curve.isInfinity(this)) return '(INFINITY)'

  return '(' + this.affineX.toString() + ',' + this.affineY.toString() + ')'
};

var point = Point;

var {assert: assert$2} = assert_1;




function Curve (p, a, b, Gx, Gy, n, h) {
  this.p = p;
  this.a = a;
  this.b = b;
  this.G = point.fromAffine(this, Gx, Gy);
  this.n = n;
  this.h = h;

  this.infinity = new point(this, null, null, lib$1.ZERO);

  // result caching
  this.pOverFour = p.add(lib$1.ONE).shiftRight(2);

  // determine size of p in bytes
  this.pLength = Math.floor((this.p.bitLength() + 7) / 8);
}

Curve.prototype.pointFromX = function (isOdd, x) {
  var alpha = x.pow(3).add(this.a.multiply(x)).add(this.b).mod(this.p);
  var beta = alpha.modPow(this.pOverFour, this.p); // XXX: not compatible with all curves

  var y = beta;
  if (beta.isEven() ^ !isOdd) {
    y = this.p.subtract(y); // -y % p
  }

  return point.fromAffine(this, x, y)
};

Curve.prototype.isInfinity = function (Q) {
  if (Q === this.infinity) return true

  return Q.z.signum() === 0 && Q.y.signum() !== 0
};

Curve.prototype.isOnCurve = function (Q) {
  if (this.isInfinity(Q)) return true

  var x = Q.affineX;
  var y = Q.affineY;
  var a = this.a;
  var b = this.b;
  var p = this.p;

  // Check that xQ and yQ are integers in the interval [0, p - 1]
  if (x.signum() < 0 || x.compareTo(p) >= 0) return false
  if (y.signum() < 0 || y.compareTo(p) >= 0) return false

  // and check that y^2 = x^3 + ax + b (mod p)
  var lhs = y.square().mod(p);
  var rhs = x.pow(3).add(a.multiply(x)).add(b).mod(p);
  return lhs.equals(rhs)
};

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
Curve.prototype.validate = function (Q) {
  // Check Q != O
  assert$2(!this.isInfinity(Q), 'Point is at infinity');
  assert$2(this.isOnCurve(Q), 'Point is not on the curve');

  // Check nQ = O (where Q is a scalar multiple of G)
  var nQ = Q.multiply(this.n);
  assert$2(this.isInfinity(nQ), 'Point is not a scalar multiple of G');

  return true
};

var curve = Curve;

const secp128r1 = {
  p: "fffffffdffffffffffffffffffffffff",
  a: "fffffffdfffffffffffffffffffffffc",
  b: "e87579c11079f43dd824993c2cee5ed3",
  n: "fffffffe0000000075a30d1b9038a115",
  h: "01",
  Gx: "161ff7528b899b2d0c28607ca52c5b86",
  Gy: "cf5ac8395bafeb13c02da292dded7a83"
};
const secp160k1 = {
  p: "fffffffffffffffffffffffffffffffeffffac73",
  a: "00",
  b: "07",
  n: "0100000000000000000001b8fa16dfab9aca16b6b3",
  h: "01",
  Gx: "3b4c382ce37aa192a4019e763036f4f5dd4d7ebb",
  Gy: "938cf935318fdced6bc28286531733c3f03c4fee"
};
const secp160r1 = {
  p: "ffffffffffffffffffffffffffffffff7fffffff",
  a: "ffffffffffffffffffffffffffffffff7ffffffc",
  b: "1c97befc54bd7a8b65acf89f81d4d4adc565fa45",
  n: "0100000000000000000001f4c8f927aed3ca752257",
  h: "01",
  Gx: "4a96b5688ef573284664698968c38bb913cbfc82",
  Gy: "23a628553168947d59dcc912042351377ac5fb32"
};
const secp192k1 = {
  p: "fffffffffffffffffffffffffffffffffffffffeffffee37",
  a: "00",
  b: "03",
  n: "fffffffffffffffffffffffe26f2fc170f69466a74defd8d",
  h: "01",
  Gx: "db4ff10ec057e9ae26b07d0280b7f4341da5d1b1eae06c7d",
  Gy: "9b2f2f6d9c5628a7844163d015be86344082aa88d95e2f9d"
};
const secp192r1 = {
  p: "fffffffffffffffffffffffffffffffeffffffffffffffff",
  a: "fffffffffffffffffffffffffffffffefffffffffffffffc",
  b: "64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1",
  n: "ffffffffffffffffffffffff99def836146bc9b1b4d22831",
  h: "01",
  Gx: "188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012",
  Gy: "07192b95ffc8da78631011ed6b24cdd573f977a11e794811"
};
const secp256k1 = {
  p: "fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f",
  a: "00",
  b: "07",
  n: "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
  h: "01",
  Gx: "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
  Gy: "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
};
const secp256r1 = {
  p: "ffffffff00000001000000000000000000000000ffffffffffffffffffffffff",
  a: "ffffffff00000001000000000000000000000000fffffffffffffffffffffffc",
  b: "5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b",
  n: "ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551",
  h: "01",
  Gx: "6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
  Gy: "4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"
};
var curves = {
  secp128r1: secp128r1,
  secp160k1: secp160k1,
  secp160r1: secp160r1,
  secp192k1: secp192k1,
  secp192r1: secp192r1,
  secp256k1: secp256k1,
  secp256r1: secp256r1
};

function getCurveByName (name) {
  var curve$1 = curves[name];
  if (!curve$1) return null

  var p = new lib$1(curve$1.p, 16);
  var a = new lib$1(curve$1.a, 16);
  var b = new lib$1(curve$1.b, 16);
  var n = new lib$1(curve$1.n, 16);
  var h = new lib$1(curve$1.h, 16);
  var Gx = new lib$1(curve$1.Gx, 16);
  var Gy = new lib$1(curve$1.Gy, 16);

  return new curve(p, a, b, Gx, Gy, n, h)
}

var names = getCurveByName;

var lib = {
  Curve: curve,
  Point: point,
  getCurveByName: names
};

var Point$1 = lib.Point;
var getCurveByName$1 = lib.getCurveByName;
export { Point$1 as Point, getCurveByName$1 as getCurveByName };
