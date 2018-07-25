import fs from 'fs'
import { promisify } from 'util'

export default {
    readFile: promisify(fs.readFile),
}
