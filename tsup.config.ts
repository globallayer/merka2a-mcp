import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: false,
  noExternal: [/@merk\.a2a\/.*/],
})
