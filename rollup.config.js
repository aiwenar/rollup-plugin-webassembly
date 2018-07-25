export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/index.es.js',
            format: 'es',
        },
        {
            file: 'dist/index.cjs.js',
            format: 'cjs',
        },
    ],
}