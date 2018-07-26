import { makeLegalIdentifier } from 'rollup-pluginutils'

const importStmt = imports => Object.keys(imports).map(module =>
    `import * as ${makeLegalIdentifier(module)} from '${module}';`
).join('\n')

const exportStmt = exports => 'export const ' + exports.map(name =>
    `${name} = instance.exports.${name}`
).join(', ') + ';'

const importObject = imports => '{ ' + Object.keys(imports).map(module =>
    `'${module}': ${makeLegalIdentifier(module)}`
).join(', ') + ' }'

export const async = (code, imports) => `
${importStmt(imports)}

const request = fetch(import.meta.ROLLUP_ASSET_URL_${code});
export default WebAssembly.instantiateStreaming(request, ${importObject(imports)})
    .then(instance => instance.exports)
`

export const sync = (code, imports, exports) => `
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
`
