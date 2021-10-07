const commonApi = require('./api_common')
const objectApi = require('./api_object')

const ecc = Object.assign({}, commonApi, objectApi)

export default ecc
