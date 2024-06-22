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

    return (
        <div class='block-empty'>
            <button class='styled' onClick={() => update('text')}>
                متن
            </button>
            <button class='styled' onClick={() => update('image')}>
                عکس
            </button>
        </div>
    )
}
