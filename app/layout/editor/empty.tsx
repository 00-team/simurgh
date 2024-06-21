import { Component } from 'solid-js'
import './style/empty.scss'
import { EditorBlockProps, setStore } from './store'
import { BlogData, DEFAULT_BLOCKS } from 'models'
import { produce } from 'solid-js/store'

export const EditorEmptyBlock: Component<EditorBlockProps> = P => {
    function update(kind: BlogData['kind']) {
        setStore(
            produce(s => {
                s.data[P.idx] = DEFAULT_BLOCKS[kind]
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
