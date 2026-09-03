/// <reference types="vite/client" />

/** Injecté à la compilation depuis le champ `version` de package.json. */
declare const __VERSION__: string

declare module '*.png' {
  const src: string
  export default src
}
