import {
    Component,
    Show,
    createMemo,
    createSignal,
    onCleanup,
    onMount,
} from 'solid-js'
import {
    BLOG_ALIGN,
    BlogStyle,
    BlogText,
    BlogTextGroup,
    DEFAULT_STYLE,
} from 'models'

import './style/text.scss'
import { setStore, store } from './store'
import {
    AArrowDownIcon,
    AArrowUpIcon,
    AlignCenterIcon,
    BoldIcon,
    EyeIcon,
    EyeOffIcon,
    ItalicIcon,
    PaletteIcon,
    PilcrowLeftIcon,
    PilcrowRightIcon,
    RotateCcwIcon,
    SplitIcon,
    UnderlineIcon,
} from 'icons'
import { createStore, produce } from 'solid-js/store'

function span_style(span: HTMLSpanElement): BlogStyle {
    return {
        color: span.style.color,
        bold: span.classList.contains('bold'),
        italic: span.classList.contains('italic'),
        underline: span.classList.contains('underline'),
        font_size: parseInt(span.style.fontSize.slice(0, -2)),
    }
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
                        style: { ...DEFAULT_STYLE },
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
                style: { ...DEFAULT_STYLE },
            })
            texts = ''
        }

        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogText
                b.groups = [...groups]
            })
        )
    }

    onMount(() => document.addEventListener('editor_pre_save', pre_save))
    onCleanup(() => document.removeEventListener('editor_pre_save', pre_save))

    return (
        <div class='block-text'>
            <Show when={placeholder()}>
                <span class='placeholder title_smaller'>
                    متن خود را وارد کنید ...
                </span>
            </Show>
            <p
                ref={p}
                class='text-content'
                classList={{ show_groups: store.show_groups }}
                style={{ direction: P.block.dir, 'text-align': P.block.align }}
                id={`block_paragraph_${P.idx}`}
                onMouseDown={() => setStore({ tg: -1 })}
                onInput={e => {
                    if (store.active != P.idx) {
                        setStore({ active: P.idx })
                    }
                    setPlaceholer(!e.currentTarget.innerHTML)
                    for (let el of e.currentTarget.childNodes) {
                        if (el.nodeType == Node.TEXT_NODE) {
                            return pre_save()
                        }
                    }
                }}
                onFocus={() => setStore({ active: P.idx })}
                contenteditable={'plaintext-only'}
            >
                {P.block.groups.map((g, i) => (
                    <span
                        style={{
                            color: g.style.color,
                            'font-size':
                                g.style.font_size && g.style.font_size + 'px',
                            '--bc': 'var(--c' + (i % 3) + ')',
                        }}
                        classList={{
                            active: store.active == P.idx && store.tg == i,
                            show_border: store.show_groups,
                            bold: g.style.bold,
                            italic: g.style.italic,
                            underline: g.style.underline,
                        }}
                        onMouseDown={e => {
                            e.stopPropagation()
                            setStore({ tg: i })
                        }}
                        class='title_smaller'
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
        setState({ spliter: false })
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
                b.groups = [...grouped_content]
            })
        )
    }

    function set_style(v: Partial<BlogStyle>) {
        setStore(
            produce(s => {
                let g = (s.data[s.active] as BlogText).groups[s.tg]
                g.style = { ...g.style, ...v }
            })
        )
    }

    function set_attr(
        cb: (b: BlogText) => Partial<Omit<BlogText, 'kind' | 'groups'>>
    ) {
        setStore(
            produce(s => {
                let b = s.data[s.active] as BlogText
                let v = cb(b)
                s.data[s.active] = { ...b, ...v }
            })
        )
    }

    const block = createMemo(() => store.block as BlogText)

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
            <Show when={store.tgroup && !state.spliter}>
                <button
                    class='styled icon'
                    style={{ '--color': store.tgroup.style.color }}
                    onClick={() => {
                        let el = document.createElement('input')
                        el.setAttribute('type', 'color')
                        el.setAttribute('value', store.tgroup.style.color)
                        el.oninput = () => set_style({ color: el.value })
                        el.click()
                    }}
                >
                    <PaletteIcon />
                </button>
                <button
                    class='styled icon'
                    classList={{ active: store.tgroup.style.bold }}
                    onClick={() =>
                        set_style({ bold: !store.tgroup.style.bold })
                    }
                >
                    <BoldIcon />
                </button>
                <button
                    class='styled icon'
                    classList={{ active: store.tgroup.style.italic }}
                    onClick={() =>
                        set_style({ italic: !store.tgroup.style.italic })
                    }
                >
                    <ItalicIcon />
                </button>
                <button
                    class='styled icon'
                    classList={{ active: store.tgroup.style.underline }}
                    onClick={() =>
                        set_style({ underline: !store.tgroup.style.underline })
                    }
                >
                    <UnderlineIcon />
                </button>

                <FontSizeButton dir={-1} />
                <FontSizeButton dir={1} />
                <button
                    class='styled icon'
                    style='--color: var(--yellow)'
                    onClick={() => set_style(DEFAULT_STYLE)}
                >
                    <RotateCcwIcon />
                </button>
            </Show>
            <button
                class='styled icon'
                onClick={() =>
                    set_attr(b => ({
                        align: b.align ? BLOG_ALIGN[b.align][0] : 'center',
                    }))
                }
            >
                {block().align ? (
                    BLOG_ALIGN[block().align][1]()
                ) : (
                    <AlignCenterIcon />
                )}
            </button>
            <button
                class='styled icon'
                onClick={() =>
                    set_attr(b => ({ dir: b.dir == 'ltr' ? 'rtl' : 'ltr' }))
                }
            >
                <Show
                    when={(store.block as BlogText).dir == 'ltr'}
                    fallback={<PilcrowLeftIcon />}
                >
                    <PilcrowRightIcon />
                </Show>
            </button>
        </div>
    )
}

type FontSizeButtonProps = {
    dir: -1 | 1
}
const FontSizeButton: Component<FontSizeButtonProps> = P => {
    let timer: number

    function add_size() {
        setStore(
            produce(s => {
                let g = (s.data[s.active] as BlogText).groups[s.tg]
                let fs = g.style.font_size + P.dir
                if (fs < 1) fs = 1
                if (fs > 1024) fs = 1024
                g.style = { ...g.style, font_size: fs }
            })
        )
    }

    function clear() {
        clearInterval(timer)
    }

    onMount(() => document.addEventListener('mouseup', clear))
    onCleanup(() => document.removeEventListener('mouseup', clear))

    return (
        <button
            class='styled icon'
            onClick={add_size}
            onMouseDown={() => {
                timer = setInterval(add_size, 100)
            }}
        >
            <Show when={P.dir == 1} fallback={<AArrowDownIcon />}>
                <AArrowUpIcon />
            </Show>
        </button>
    )
}
