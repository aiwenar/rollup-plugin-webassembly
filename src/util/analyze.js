import { traverse } from '@webassemblyjs/ast'
import { decode } from '@webassemblyjs/wasm-parser'

/**
 * Analyse a WebAssembly module.
 *
 * The returned object contains two properties: `exports` which is a simple flat
 * list of exported names, and `imports` which is a mapping from module names
 * (strings) to lists of names imported from those modules.
 *
 * @param {Buffer} code
 *
 * @return {object}
 */
export default function analyze(code) {
    const ast = decode(code)

    const imports = {}
    const exports = []

    traverse(ast, {
        ModuleImport(path) {
            const { module, name } = path.node

            if (!(module in imports)) {
                imports[module] = []
            }

            imports[module].push(name)
        },
        ModuleExport(path) {
            exports.push(path.node.name)
        },
    })

    return { imports, exports }
}
