import { ArrowLeftIcon } from 'icons'
import { BlogData, BlogModel, DEFAULT_BLOG } from 'models'
import { createEffect, createRoot } from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'

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

export function unwrap_rec<T>(value: T): T {
    if (typeof value == 'object') {
        if (value == null || value == undefined) return value

        if (Array.isArray(value)) {
            return value.map(t => unwrap_rec(t)) as T
        } else {
            return Object.entries(value)
                .map(([k, v]) => [k, unwrap_rec(v)])
                .reduce((obj, v) => {
                    obj[v[0]] = v[1]
                    return obj
                }, {}) as T
        }
    }
    return value
}

createRoot(() => {
    createEffect(() => {
        setStore({ data: unwrap_rec(store.blog.data) })
    })
})
