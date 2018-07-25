import { createFilter } from 'rollup-pluginutils'

const DEFAULT_OPTIONS = {
    include: '**/*.wasm',
    exclude: null,
}

export default function WebAssembly(options={}) {
    const { include, exclude } = Object.assign({}, DEFAULT_OPTIONS, options)

    const filter = createFilter(include, exclude)

    return {
        name: 'WebAssembly',
    }
}
