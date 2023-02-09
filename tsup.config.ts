import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/ServiceContract.ts'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts:true,
    watch:true
})