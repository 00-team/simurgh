import { BlogData, BlogModel, DEFAULT_BLOG } from 'models'
import { createEffect, createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'

export type Store = {
    blog: BlogModel
    data: BlogData[]
    active: number
    block: BlogData | undefined
}
export const [store, setStore] = createStore<Store>({
    blog: DEFAULT_BLOG,
    data: [],
    active: -1,
    get block() {
        return this.data[this.active]
    },
})

createRoot(() => {
    createEffect(() => {
        setStore({ data: store.blog.data })
    })
})

export type EditorBlockProps = {
    idx: number
    block: BlogData
}
