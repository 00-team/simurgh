export const __X = 0

declare global {
    var umami:
        | {
              track(...p: any): void
              identify(...p: any): void
          }
        | undefined

    var __SSR_DATA__: { [k: string]: any }
    var HOST: string
    var __SSR_RENDER_HASH__: string
    var RENDERING_FOR_CAHCHE: boolean
}
