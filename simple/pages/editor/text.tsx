import { Component, Show, onCleanup, onMount } from 'solid-js'
import {
    BLOG_ALIGN,
    BlogStyle,
    BlogText,
    BlogTextGroup,
    DEFAULT_STYLE,
    DEFAULT_TEXT_GROUP,
} from 'models'

import './style/text.scss'
import { setStore, store, unwrap_rec } from './store'
import {
    AArrowDownIcon,
    AArrowUpIcon,
    BoldIcon,
    CodeXmlIcon,
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

function group_data(span: HTMLSpanElement): Omit<BlogTextGroup, 'content'> {
    return {
        style: {
            color: span.style.color,
            bold: span.classList.contains('bold'),
            italic: span.classList.contains('italic'),
            underline: span.classList.contains('underline'),
            code: span.classList.contains('code'),
            mark: span.classList.contains('mark'),
            font_size: parseInt(span.style.fontSize.slice(0, -2)),
            font_family: span.style.fontFamily,
        },
        url: span.dataset.url,
    }
}

type Props = {
    idx: number
    block: BlogText
}
export const EditorTextBlock: Component<Props> = P => {
    type State = {
        placeholder: boolean
        ag: number
        group?: BlogTextGroup
    }
    const [state, setState] = createStore<State>({
        placeholder:
            P.block.groups.length == 0 ||
            !P.block.groups.find(g => g.content.length),
        ag: -1,
        get group() {
            return P.block.groups[this.ag]
        },
    })

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
                        ...DEFAULT_TEXT_GROUP,
                        content: texts.split('\n'),
                    })
                    texts = ''
                }

                groups.push({
                    ...group_data(n),
                    content: n.textContent.split('\n'),
                })
            } else {
                texts += n.textContent || ''
            }
        })

        if (texts) {
            groups.push({
                ...DEFAULT_TEXT_GROUP,
                content: texts.split('\n'),
            })
            texts = ''
        }

        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogText
                b.groups = unwrap_rec(groups)
            })
        )
    }

    onMount(() => document.addEventListener('editor_pre_save', pre_save))
    onCleanup(() => document.removeEventListener('editor_pre_save', pre_save))

    return (
        <div class='block-text'>
            <Actions
                idx={P.idx}
                block={P.block}
                group={state.group}
                ag={state.ag}
            />
            <div class='text-section'>
                <Show when={state.placeholder}>
                    <span class='placeholder'>متن خود را وارد کنید ...</span>
                </Show>
                <p
                    ref={p}
                    class='text-content'
                    classList={{ show_groups: store.show_groups }}
                    style={{
                        direction: P.block.dir,
                        'text-align': P.block.align,
                    }}
                    id={`block_paragraph_${P.idx}`}
                    onMouseDown={() => setState({ ag: -1 })}
                    onInput={e => {
                        if (store.active != P.idx) {
                            setStore({ active: P.idx })
                        }
                        setState({ placeholder: !e.currentTarget.innerText })
                    }}
                    onFocus={() => setStore({ active: P.idx })}
                    contenteditable={'plaintext-only'}
                >
                    {P.block.groups.map((g, i) => (
                        <span
                            data-url={g.url}
                            style={{
                                color: g.style.color,
                                'font-size':
                                    g.style.font_size &&
                                    g.style.font_size + 'px',
                                'font-family': g.style.font_family,
                                '--bc': 'var(--c' + (i % 3) + ')',
                            }}
                            classList={{
                                active: store.active == P.idx && state.ag == i,
                                show_border: store.show_groups,
                                bold: g.style.bold,
                                italic: g.style.italic,
                                underline: g.style.underline,
                                code: g.style.code,
                                mark: g.style.mark,
                            }}
                            onMouseDown={e => {
                                e.stopPropagation()
                                setState({ ag: i })
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
        </div>
    )
}

type ActionsProps = Props & {
    group?: BlogTextGroup
    ag: number
}
const Actions: Component<ActionsProps> = P => {
    type State = {
        spliter: boolean
    }
    const [state, setState] = createStore<State>({ spliter: false })

    function selection_change() {
        let show = false
        let selection = document.getSelection()
        let p = document.getElementById('block_paragraph_' + P.idx)

        if (p && !selection.isCollapsed && selection.rangeCount) {
            let range = selection.getRangeAt(0)
            let sc = range.startContainer
            let ec = range.endContainer
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
    })

    function new_group() {
        setState({ spliter: false })
        let selection = document.getSelection()
        let p = document.getElementById('block_paragraph_' + P.idx)
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
                let tgd: BlogTextGroup = { content: [], ...group_data(n) }
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
            let d = data.get(last_g) || DEFAULT_TEXT_GROUP
            grouped_content.push({ ...d, content: c })

            last_g = g
            if (i == groups.length - 1) {
                let cstr = content.slice(last_g)
                if (!cstr) continue
                let c = cstr.split('\n')
                let d = data.get(last_g) || DEFAULT_TEXT_GROUP
                grouped_content.push({ ...d, content: c })
            }
        }

        p.innerHTML = ''
        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogText
                b.groups = [...grouped_content]
            })
        )
    }

    function set_style(v: Partial<BlogStyle>) {
        setStore(
            produce(s => {
                let g = (s.data[P.idx] as BlogText).groups[P.ag]
                g.style = { ...g.style, ...v }
            })
        )
    }

    function set_attr(
        cb: (b: BlogText) => Partial<Omit<BlogText, 'kind' | 'groups'>>
    ) {
        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogText
                let v = cb(b)
                s.data[P.idx] = { ...b, ...v }
            })
        )
    }

    return (
        <div class='text-actions'>
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
            <Show when={P.group && !state.spliter}>
                <button
                    class='styled icon'
                    style={{ '--color': P.group.style.color }}
                    onClick={() => {
                        let el = document.createElement('input')
                        el.setAttribute('type', 'color')
                        el.setAttribute('value', P.group.style.color)
                        el.oninput = () => set_style({ color: el.value })
                        el.click()
                    }}
                >
                    <PaletteIcon />
                </button>
                <button
                    class='styled icon'
                    classList={{ active: P.group.style.bold }}
                    onClick={() => set_style({ bold: !P.group.style.bold })}
                >
                    <BoldIcon />
                </button>
                <button
                    class='styled icon'
                    classList={{ active: P.group.style.italic }}
                    onClick={() => set_style({ italic: !P.group.style.italic })}
                >
                    <ItalicIcon />
                </button>
                <button
                    class='styled icon'
                    classList={{ active: P.group.style.underline }}
                    onClick={() =>
                        set_style({ underline: !P.group.style.underline })
                    }
                >
                    <UnderlineIcon />
                </button>
                <button
                    class='styled icon'
                    classList={{ active: P.group.style.code }}
                    onClick={() => set_style({ code: !P.group.style.code })}
                >
                    <CodeXmlIcon />
                </button>
                <button
                    class='styled icon'
                    classList={{ active: P.group.style.mark }}
                    onClick={() => set_style({ mark: !P.group.style.mark })}
                >
                    M
                </button>

                <FontSizeButton idx={P.idx} ag={P.ag} dir={-1} />
                <FontSizeButton idx={P.idx} ag={P.ag} dir={1} />
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
                    set_attr(b => ({ align: BLOG_ALIGN[b.align][0] }))
                }
                title={'align: ' + P.block.align}
            >
                {BLOG_ALIGN[P.block.align][1]()}
            </button>
            <button
                class='styled icon'
                onClick={() =>
                    set_attr(b => ({ dir: b.dir == 'ltr' ? 'rtl' : 'ltr' }))
                }
                title={'dir: ' + P.block.dir}
            >
                <Show
                    when={P.block.dir == 'ltr'}
                    fallback={<PilcrowRightIcon />}
                >
                    <PilcrowLeftIcon />
                </Show>
            </button>
        </div>
    )
}

type FontSizeButtonProps = {
    dir: -1 | 1
    ag: number
    idx: number
}
const FontSizeButton: Component<FontSizeButtonProps> = P => {
    let timer: number

    function add_size() {
        setStore(
            produce(s => {
                let g = (s.data[P.idx] as BlogText).groups[P.ag]
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
