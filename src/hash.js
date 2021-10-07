import createHash from 'create-hash'
import createHmac from 'create-hmac'

/** @namespace hash */

/** @arg {string|Buffer} data
    @arg {string} [resultEncoding = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when resultEncoding is null, or string
*/
export function sha1(data, resultEncoding) {
    return createHash('sha1').update(data).digest(resultEncoding)
}

/** @arg {string|Buffer} data
    @arg {string} [resultEncoding = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when resultEncoding is null, or string
*/
export function sha256(data, resultEncoding) {
    return createHash('sha256').update(data).digest(resultEncoding)
}

/** @arg {string|Buffer} data
    @arg {string} [resultEncoding = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when resultEncoding is null, or string
*/
export function sha512(data, resultEncoding) {
    return createHash('sha512').update(data).digest(resultEncoding)
}

export function HmacSHA256(buffer, secret) {
    return createHmac('sha256', secret).update(buffer).digest()
}

export function ripemd160(data) {
    try{
	    return createHash('rmd160').update(data).digest();
    } catch(e){
	    return createHash('ripemd160').update(data).digest();
    }
}

// export function hash160(buffer) {
//   return ripemd160(sha256(buffer))
// }
//
// export function hash256(buffer) {
//   return sha256(sha256(buffer))
// }

//
// export function HmacSHA512(buffer, secret) {
//   return crypto.createHmac('sha512', secret).update(buffer).digest()
// }