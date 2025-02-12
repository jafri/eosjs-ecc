import {assert, assertEqual} from './assert'
import enforceType from './enforce_types'
import BigInteger from 'bigi'

function ECSignature(r, s) {
  enforceType(BigInteger, r)
  enforceType(BigInteger, s)

  function toCompact(i, compressed) {
    if (compressed) i += 4
    i += 27

    var buffer = new Buffer(65)
    buffer.writeUInt8(i, 0)

    r.toBuffer(32).copy(buffer, 1)
    s.toBuffer(32).copy(buffer, 33)

    return buffer
  }

  function toDER() {
    var rBa = r.toDERInteger()
    var sBa = s.toDERInteger()

    var sequence = []

    // INTEGER
    sequence.push(0x02, rBa.length)
    sequence = sequence.concat(rBa)

    // INTEGER
    sequence.push(0x02, sBa.length)
    sequence = sequence.concat(sBa)

    // SEQUENCE
    sequence.unshift(0x30, sequence.length)

    return new Buffer(sequence)
  }

  function toScriptSignature(hashType) {
    var hashTypeBuffer = new Buffer(1)
    hashTypeBuffer.writeUInt8(hashType, 0)

    return Buffer.concat([toDER(), hashTypeBuffer])
  }

  return {r, s, toCompact, toDER, toScriptSignature}
}

// Import operations
ECSignature.parseCompact = function(buffer) {
  assertEqual(buffer.length, 65, 'Invalid signature length')
  var i = buffer.readUInt8(0) - 27

  // At most 3 bits
  assertEqual(i, i & 7, 'Invalid signature parameter')
  var compressed = !!(i & 4)

  // Recovery param only
  i = i & 3

  var r = BigInteger.fromBuffer(buffer.slice(1, 33))
  var s = BigInteger.fromBuffer(buffer.slice(33))

  return {
    compressed: compressed,
    i: i,
    signature: ECSignature(r, s)
  }
}

ECSignature.fromDER = function(buffer) {
  assertEqual(buffer.readUInt8(0), 0x30, 'Not a DER sequence')
  assertEqual(buffer.readUInt8(1), buffer.length - 2, 'Invalid sequence length')
  assertEqual(buffer.readUInt8(2), 0x02, 'Expected a DER integer')

  var rLen = buffer.readUInt8(3)
  assert(rLen > 0, 'R length is zero')

  var offset = 4 + rLen
  assertEqual(buffer.readUInt8(offset), 0x02, 'Expected a DER integer (2)')

  var sLen = buffer.readUInt8(offset + 1)
  assert(sLen > 0, 'S length is zero')

  var rB = buffer.slice(4, offset)
  var sB = buffer.slice(offset + 2)
  offset += 2 + sLen

  if (rLen > 1 && rB.readUInt8(0) === 0x00) {
    assert(rB.readUInt8(1) & 0x80, 'R value excessively padded')
  }

  if (sLen > 1 && sB.readUInt8(0) === 0x00) {
    assert(sB.readUInt8(1) & 0x80, 'S value excessively padded')
  }

  assertEqual(offset, buffer.length, 'Invalid DER encoding')
  var r = BigInteger.fromDERInteger(rB)
  var s = BigInteger.fromDERInteger(sB)

  assert(r.signum() >= 0, 'R value is negative')
  assert(s.signum() >= 0, 'S value is negative')

  return ECSignature(r, s)
}

// FIXME: 0x00, 0x04, 0x80 are SIGHASH_* boundary constants, importing Transaction causes a circular dependency
ECSignature.parseScriptSignature = function(buffer) {
  var hashType = buffer.readUInt8(buffer.length - 1)
  var hashTypeMod = hashType & ~0x80

  assert(hashTypeMod > 0x00 && hashTypeMod < 0x04, 'Invalid hashType')

  return {
    signature: ECSignature.fromDER(buffer.slice(0, -1)),
    hashType: hashType
  }
}

export default ECSignature
