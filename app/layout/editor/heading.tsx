import { Component, createEffect } from 'solid-js'

import './style/heading.scss'
import { BlogHeading } from 'models'
import { setStore } from './store'
import { produce } from 'solid-js/store'

type Props = {
    idx: number
    block: BlogHeading
}
export const EditorHeadingBlock: Component<Props> = P => {
    createEffect(() => console.log({ ...P.block }))

    return (
        <div class='block-heading'>
            <input
                dir='auto'
                class='styled'
                value={P.block.content}
                onInput={e => {
                    setStore(
                        produce(s => {
                            let b = s.data[P.idx] as BlogHeading
                            b.content = e.currentTarget.value
                        })
                    )
                }}
            />
            <button
                class='styled icon'
                onClick={() => {
                    setStore(
                        produce(s => {
                            let b = s.data[P.idx] as BlogHeading
                            let l = b.level + 1
                            if (l > 6) l = 1
                            if (l < 1) l = 6
                            b.level = l
                        })
                    )
                }}
            >
                H{P.block.level}
            </button>
        </div>
    )
}
