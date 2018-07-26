import { createFilter } from 'rollup-pluginutils'

import load from './load'

const DEFAULT_OPTIONS = {
    include: '**/*.wasm',
    exclude: null,
    sync: false,
}

export default function WebAssembly(options={}) {
    const {
        include, exclude, sync,
    } = Object.assign({}, DEFAULT_OPTIONS, options)

    const filter = createFilter(include, exclude)

    let syncFilter
    if (sync === true) {
        syncFilter = () => true
    } else if (sync === false) {
        syncFilter = () => false
    } else if (typeof sync === 'string') {
        syncFilter = createFilter(sync, null)
    } else if (typeof sync === 'object') {
        syncFilter = createFilter(sync.include, sync.exclude)
    } else {
        throw new Error('Bad value for sync')
    }

    const settings = {
        filter,
        sync: syncFilter,
    }

    return {
        name: 'WebAssembly',
        load(id) { return load(settings, this, id) },
    }
}
