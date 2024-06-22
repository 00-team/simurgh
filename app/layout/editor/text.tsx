import { Component, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { BlogStyle, BlogText, BlogTextGroup, DEFAULT_STYLE } from 'models'

import './style/text.scss'
import { setStore, store } from './store'
import { EyeIcon, EyeOffIcon, SplitIcon } from 'icons'
import { createStore, produce } from 'solid-js/store'

function span_style(span: HTMLSpanElement): BlogStyle {
    return JSON.parse(span.dataset.style)
}

type Props = {
    idx: number
    block: BlogText
}
export const EditorTextBlock: Component<Props> = P => {
    const [placeholder, setPlaceholer] = createSignal(
        P.block.groups.length == 0 ||
            !P.block.groups.find(g => g.content.length)
    )

    let p: HTMLParagraphElement

    function pre_save() {
        let groups: BlogTextGroup[] = []
        let texts = ''
        p.childNodes.forEach(n => {
            if (n.nodeType == Node.TEXT_NODE) {
                texts += n.textContent
            } else if (n instanceof HTMLSpanElement) {
                if (texts) {
                    groups.push({
                        content: texts.split('\n'),
                        style: DEFAULT_STYLE,
                    })
                    texts = ''
                }

                groups.push({
                    content: n.textContent.split('\n'),
                    style: span_style(n),
                })
            } else {
                texts += n.textContent || ''
            }
        })

        if (texts) {
            groups.push({
                content: texts.split('\n'),
                style: DEFAULT_STYLE,
            })
            texts = ''
        }

        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogText
                b.groups = groups
            })
        )
    }

    onMount(() => document.addEventListener('editor_pre_save', pre_save))
    onCleanup(() => document.removeEventListener('editor_pre_save', pre_save))

    return (
        <div class='block-text'>
            <Show when={placeholder()}>
                <span class='placeholder'>متن خود را وارد کنید ...</span>
            </Show>
            <p
                ref={p}
                class='text-content'
                classList={{ show_groups: store.show_groups }}
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
                        data-style={JSON.stringify(g.style)}
                        style={{
                            color: g.style.color,
                            'font-size':
                                g.style.font_size && g.style.font_size + 'px',
                            '--bc': 'var(--c' + (i % 3) + ')',
                        }}
                        classList={{
                            active: store.active == P.idx && store.tg == i,
                            show_border: store.show_groups,
                        }}
                        onMouseDown={e => {
                            e.stopPropagation()
                            setStore({ tg: i })
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
    type State = {
        spliter: boolean
    }
    const [state, setState] = createStore<State>({ spliter: false })

    function selection_change() {
        let show = false
        let selection = document.getSelection()

        if (!selection.isCollapsed && selection.rangeCount) {
            let range = selection.getRangeAt(0)
            let sc = range.startContainer
            let ec = range.endContainer
            let p = document.getElementById('block_paragraph_' + store.active)
            if (!p) return
            if ((sc == p || p.contains(sc)) && (ec == p || p.contains(ec))) {
                show = true
            }
        }

        setState({ spliter: show })
    }

    onMount(() => {
        document.addEventListener('selectionchange', selection_change)
    })

    onCleanup(() => {
        document.removeEventListener('selectionchange', selection_change)

        setStore({ tg: -1 })
    })

    function new_group() {
        let p = document.getElementById('block_paragraph_' + store.active)
        let selection = document.getSelection()
        if (!p || selection.rangeCount == 0) return

        let range = selection.getRangeAt(0)
        if (range.collapsed) return

        let sc = range.startContainer
        let ec = range.endContainer

        let soff = range.startOffset
        let eoff = range.endOffset

        if (sc.childNodes.length > soff) {
            sc = sc.childNodes[soff]
            soff = 0
        }
        if (ec.childNodes.length > eoff) {
            ec = ec.childNodes[eoff]
            eoff = 0
        }

        let content = ''
        let groups: number[] = []
        let data: Map<number, BlogTextGroup> = new Map()
        let outrange = -1

        for (let n of p.childNodes) {
            if (n == sc) {
                groups.push(content.length + soff)
                outrange = 0
            }

            if (!outrange && n == ec) {
                groups.push(content.length + eoff)
                outrange = 1
            }

            if (n.nodeType == Node.TEXT_NODE) {
                content += n.textContent
            } else if (n.nodeName == 'BR') {
                content += '\n'
            } else if (n instanceof HTMLSpanElement) {
                let tgd: BlogTextGroup = {
                    style: span_style(n),
                    content: [],
                }
                if (outrange) {
                    groups.push(content.length)
                    data.set(content.length, tgd)
                }

                for (let e of n.childNodes) {
                    if (e == sc) {
                        groups.push(content.length + soff)
                        data.set(content.length + soff, tgd)
                        outrange = 0
                    }

                    if (!outrange && e == ec) {
                        groups.push(content.length + eoff)
                        data.set(content.length + eoff, tgd)
                        outrange = 1
                    }

                    if (e.nodeType == Node.TEXT_NODE) {
                        content += e.textContent
                    } else if (e.nodeName == 'BR') {
                        content += '\n'
                    } else {
                        content += e.textContent
                    }
                }
                if (outrange) groups.push(content.length)
            } else {
                content += n.textContent
            }
        }

        let grouped_content: BlogTextGroup[] = []

        let last_g = 0
        for (let [i, g] of groups.entries()) {
            let cstr = content.slice(last_g, g)
            if (!cstr) continue
            let c = cstr.split('\n')
            let d = data.get(last_g)

            if (d) {
                grouped_content.push({ ...d, content: c })
            } else {
                grouped_content.push({ content: c, style: DEFAULT_STYLE })
            }

            last_g = g
            if (i == groups.length - 1) {
                let cstr = content.slice(last_g)
                if (!cstr) continue
                let c = cstr.split('\n')
                let d = data.get(last_g)

                if (d) {
                    grouped_content.push({ ...d, content: c })
                } else {
                    grouped_content.push({ content: c, style: DEFAULT_STYLE })
                }
            }
        }

        p.innerHTML = ''
        setStore(
            produce(s => {
                let b = s.data[s.active] as BlogText
                if (!b) return
                b.groups = grouped_content
                s.data[s.active] = b
            })
        )
    }

    return (
        <div class='editor-text-actions'>
            <Show when={state.spliter}>
                <button class='styled icon' onClick={new_group}>
                    <SplitIcon />
                </button>
            </Show>
            <button
                class='styled icon'
                onClick={() => setStore(s => ({ show_groups: !s.show_groups }))}
            >
                <Show when={store.show_groups} fallback={<EyeIcon />}>
                    <EyeOffIcon />
                </Show>
            </button>
            <button class='styled icon'>X</button>
            <button class='styled icon'>X</button>
        </div>
    )
}
