import fs from 'fs';
import { promisify } from 'util';
import { traverse } from '@webassemblyjs/ast';
import { decode } from '@webassemblyjs/wasm-parser';
import { makeLegalIdentifier, createFilter } from 'rollup-pluginutils';

var fs$1 = {
    readFile: promisify(fs.readFile),
};

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
function analyze(code) {
    const ast = decode(code);

    const imports = {};
    const exports = [];

    traverse(ast, {
        ModuleImport(path) {
            const { module, name } = path.node;

            if (!(module in imports)) {
                imports[module] = [];
            }

            imports[module].push(name);
        },
        ModuleExport(path) {
            exports.push(path.node.name);
        },
    });

    return { imports, exports }
}

const importStmt = imports => Object.keys(imports).map(module =>
    `import * as ${makeLegalIdentifier(module)} from '${module}';`
).join('\n');

const exportStmt = exports => 'export const ' + exports.map(name =>
    `${name} = instance.exports.${name}`
).join(', ') + ';';

const importObject = imports => '{ ' + Object.keys(imports).map(module =>
    `'${module}': ${makeLegalIdentifier(module)}`
).join(', ') + ' }';

const async = (code, imports) => `
${importStmt(imports)}

const request = fetch(import.meta.ROLLUP_ASSET_URL_${code});
export default WebAssembly.instantiateStreaming(request, ${importObject(imports)})
    .then(instance => instance.exports)
`;

const sync = (code, imports, exports) => `
${importStmt(imports)}

const base64 = "${code.toString('base64')}";

let bytes;
if (typeof Buffer === 'undefined') {
    bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
} else {
    bytes = Buffer.from(base64, 'base64');
}

const module = new WebAssembly.Module(bytes);
const instance = new WebAssembly.Instance(module, ${importObject(imports)});

${exportStmt(exports)}
`;

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
function transform(options, ctx, id, code) {
    const { imports, exports } = analyze(code);

    if (options.sync(id)) {
        return sync(code, imports, exports)
    }

    const modid = ctx.emitAsset('module.wasm', code);
    return async(modid, imports, exports)
}

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
async function load(options, ctx, id) {
    // At this point id should be resolved to a file path.
    if (!options.filter(id)) return null

    const code = await fs$1.readFile(id);

    if (code.readUInt32BE(0) != 0x0061736d) {
        this.warn('Not a WebAssembly module. Either your include filter is too '
            + ' liberal or the module was not generated properly.');
        return null
    }

    const version = code.readUInt32LE(4);
    if (version != 1) {
        this.error('Only binary format 1 is supported, but this WebAssembly '
            + ' module uses ' + version.toString());
        return null
    }

    return transform(options, ctx, id, code)
}

const DEFAULT_OPTIONS = {
    include: '**/*.wasm',
    exclude: null,
    sync: false,
};

function WebAssembly(options={}) {
    const {
        include, exclude, sync,
    } = Object.assign({}, DEFAULT_OPTIONS, options);

    const filter = createFilter(include, exclude);

    let syncFilter;
    if (sync === true) {
        syncFilter = () => true;
    } else if (sync === false) {
        syncFilter = () => false;
    } else if (typeof sync === 'string') {
        syncFilter = createFilter(sync, null);
    } else if (typeof sync === 'object') {
        syncFilter = createFilter(sync.include, sync.exclude);
    } else {
        throw new Error('Bad value for sync')
    }

    const settings = {
        filter,
        sync: syncFilter,
    };

    return {
        name: 'WebAssembly',
        load(id) { return load(settings, this, id) },
    }
}

/**
 * @type Object
 * @name Options
 *
 * @property {(string) -> bool} filter
 * @property {(string) -> bool} sync
 */

export default WebAssembly;
