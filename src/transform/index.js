import analyze from '../util/analyze'

import * as loaders from './loaders'

/**
 * Transform a WebAssembly module into an ES6 module.
 *
 * @param {Options} options
 * @param ctx
 * @param {string} id
 * @param {Buffer} code
 *
 * @return {string}
 */
export default function transform(options, ctx, id, code) {
    const { imports, exports } = analyze(code)

    if (options.sync(id)) {
        return loaders.sync(code, imports, exports)
    }

    const modid = ctx.emitAsset('module.wasm', code)
    return loaders.async(modid, imports, exports)
}
