import { Component, Show, createMemo, createSignal } from 'solid-js'
import { BlogText } from 'models'

import './style/text.scss'
import { setStore, store } from './store'
import { produce } from 'solid-js/store'

type Props = {
    idx: number
    block: BlogText
}
export const EditorTextBlock: Component<Props> = P => {
    const [placeholder, setPlaceholer] = createSignal(
        P.block.groups.length == 0 ||
            !P.block.groups.find(g => g.content.length)
    )

    return (
        <div class='block-text'>
            <Show when={placeholder()}>
                <span class='placeholder'>متن خود را وارد کنید ...</span>
            </Show>
            <p
                class='text-content'
                style={{ direction: P.block.dir }}
                id={`block_paragraph_${P.idx}`}
                onMouseDown={() => setStore({ tg: -1 })}
                onInput={e => {
                    if (store.active != P.idx) {
                        setStore({ active: P.idx })
                    }
                    setPlaceholer(!e.currentTarget.innerHTML)
                }}
                onFocus={() => setStore({ active: P.idx })}
                contenteditable={'plaintext-only'}
            >
                {P.block.groups.map((g, i) => (
                    <span
                        // data-comp={comp_data(g)}
                        // style={{
                        //     color: g.color,
                        //     'font-size': g.font_size && g.font_size + 'px',
                        //     '--bc': 'var(--c' + (i % 3) + ')',
                        // }}
                        classList={{
                            active: store.active == P.idx && store.tg == i,
                            show_border: store.show_groups,
                        }}
                        onMouseDown={e => {
                            e.stopPropagation()
                            // setWareHouse(
                            //     produce(s => {
                            //         let b = s.blocks[P.id] as TextBlock
                            //         b.active = i
                            //     })
                            // )
                        }}
                    >
                        {g.content.map((line, li, a) => (
                            <>
                                {line}
                                {li != a.length - 1 && <br />}
                            </>
                        ))}
                    </span>
                ))}
            </p>
        </div>
    )
}

export const EditorTextActions = () => {
    return (
        <div class='editor-text-actions'>
            <button class='styled icon'>X</button>
            <button class='styled icon'>X</button>
            <button class='styled icon'>X</button>
            <button class='styled icon'>X</button>
        </div>
    )
}
