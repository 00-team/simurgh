import { Component } from 'solid-js'
import { setStore } from './store'
import { BlogData, BlogEmpty, DEFAULT_BLOCKS } from 'models'
import { produce } from 'solid-js/store'

import './style/empty.scss'

type Props = {
    idx: number
    block: BlogEmpty
}
export const EditorEmptyBlock: Component<Props> = P => {
    function update(kind: BlogData['kind']) {
        setStore(
            produce(s => {
                s.data[P.idx] = { ...DEFAULT_BLOCKS[kind] }
            })
        )
    }

    const BLOCKS: { [k in Exclude<BlogData['kind'], 'empty'>]: string } = {
        heading: 'عنوان',
        text: 'متن',
        image: 'عکس',
    }

    return (
        <div class='block-empty'>
            {Object.entries(BLOCKS).map(([k, v]) => (
                <button
                    class='styled'
                    onClick={() => update(k as BlogData['kind'])}
                >
                    {v}
                </button>
            ))}
        </div>
    )
}
