import { BlogData, BlogModel, DEFAULT_BLOG } from 'models'
import { createStore } from 'solid-js/store'

export type Store = {
    blog: BlogModel
    data: BlogData[]
}
export const [store, setStore] = createStore<Store>({
    blog: DEFAULT_BLOG,
    data: [],
})
