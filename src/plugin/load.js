import fs from '../util/fs'

import transform from '../transform'

/**
 * Load and transform a WebAssembly module.
 *
 * We transform modules in `load` rather than `transform` to avoid loading them
 * as text and potentially confusing other plugins or even Rollup itself.
 *
 * @param {Options} filter
 * @param ctx
 * @param {string}  id
 *
 * @return {string|null}
 */
export default async function load(options, ctx, id) {
    // At this point id should be resolved to a file path.
    if (!options.filter(id)) return null

    const code = await fs.readFile(id)

    if (code.readUInt32BE(0) != 0x0061736d) {
        this.warn('Not a WebAssembly module. Either your include filter is too '
            + ' liberal or the module was not generated properly.')
        return null
    }

    const version = code.readUInt32LE(4)
    if (version != 1) {
        this.error('Only binary format 1 is supported, but this WebAssembly '
            + ' module uses ' + version.toString())
        return null
    }

    return transform(options, ctx, id, code)
}
