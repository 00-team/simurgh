import {
    BlogStyle,
    BlogText,
    BlogTextGroup,
    BLOG_ALIGN,
    DEFAULT_TEXT_GROUP,
} from 'models'
import { Component, onCleanup, onMount, Show } from 'solid-js'

import { Action } from 'comps/action'
import { Tooltip } from 'comps/tooltip'
import {
    AArrowDownIcon,
    AArrowUpIcon,
    BoldIcon,
    CodeXmlIcon,
    HighlighterIcon,
    ItalicIcon,
    LinkIcon,
    PaletteIcon,
    PilcrowLeftIcon,
    PilcrowRightIcon,
    RotateCcwIcon,
    SplitIcon,
    TypeIcon,
    UnderlineIcon,
} from 'icons'
import { createStore, produce } from 'solid-js/store'
import { setStore, store, unwrap_rec } from './store'
import './style/text.scss'

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
                    content: n.innerText.split('\n'),
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
        <div class='block-text' onMouseLeave={pre_save}>
            <Actions
                idx={P.idx}
                block={P.block}
                group={state.group}
                ag={state.ag}
            />
            <div class='text-section'>
                <Show when={state.placeholder}>
                    <span class='placeholder title_small'>
                        متن خود را وارد کنید ...
                    </span>
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
                        setState({
                            placeholder: !e.currentTarget.innerText.trim(),
                        })
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

    function reset() {
        setStore(
            produce(s => {
                let b = s.data[P.idx] as BlogText
                let g = b.groups[P.ag]
                b.groups[P.ag] = {
                    ...DEFAULT_TEXT_GROUP,
                    content: [...g.content],
                }
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
            <div class='actions-row'>
                <div
                    class='actions-wrapper '
                    classList={{ disable: !state.spliter }}
                >
                    <button
                        class='action icon title_small flex'
                        onClick={new_group}
                        classList={{ active: P.block.align === 'left' }}
                    >
                        گروه جدید
                        <SplitIcon />
                    </button>
                </div>
                <div class='actions-wrapper'>
                    <button
                        class='action icon'
                        onClick={() => {
                            set_attr(b => ({
                                align: 'left',
                            }))
                        }}
                        classList={{ active: P.block.align === 'left' }}
                    >
                        {BLOG_ALIGN['left'][1]()}
                    </button>
                    <button
                        class='action icon'
                        onClick={() => {
                            set_attr(b => ({
                                align: 'center',
                            }))
                        }}
                        classList={{ active: P.block.align === 'center' }}
                    >
                        {BLOG_ALIGN['center'][1]()}
                    </button>
                    <button
                        class='action icon'
                        onClick={() => {
                            set_attr(b => ({
                                align: 'right',
                            }))
                        }}
                        classList={{ active: P.block.align === 'right' }}
                    >
                        {BLOG_ALIGN['right'][1]()}
                    </button>
                </div>
                <div class='actions-wrapper directions'>
                    <button
                        classList={{ active: P.block.dir === 'rtl' }}
                        class='action icon'
                        onClick={() => {
                            set_attr(b => ({
                                dir: 'rtl',
                            }))
                        }}
                    >
                        <PilcrowRightIcon />
                    </button>
                    <button
                        classList={{ active: P.block.dir === 'ltr' }}
                        class='action icon'
                        onClick={() => {
                            set_attr(b => ({
                                dir: 'ltr',
                            }))
                        }}
                    >
                        <PilcrowLeftIcon />
                    </button>
                </div>
            </div>

            <Show when={P.group && !state.spliter}>
                <div class='actions-row'>
                    <div class='actions-wrapper'>
                        <button
                            class='action title_smaller flex'
                            // style={{ color: P.group.style.color }}
                        >
                            رنگ
                            <PaletteIcon />
                        </button>
                        <FontSizeButton idx={P.idx} ag={P.ag} dir={-1} />
                        <FontSizeButton idx={P.idx} ag={P.ag} dir={1} />
                    </div>
                    {/* <Action
                        color={P.group.style.color}
                        icon={PaletteIcon}
                        title='رنگ'
                        onAct={() => {
                            let el = document.createElement('input')
                            el.setAttribute('type', 'color')
                            el.setAttribute('value', P.group.style.color)
                            el.oninput = () => set_style({ color: el.value })
                            el.click()
                        }}
                    /> */}
                    <div class='actions-wrapper'>
                        <button
                            class='action title_smaller '
                            // style={{ color: P.group.style.color }}
                            classList={{ active: P.group.style.bold }}
                            onclick={() =>
                                set_style({ bold: !P.group.style.bold })
                            }
                        >
                            <BoldIcon />
                        </button>
                        <button
                            class='action title_smaller '
                            // style={{ color: P.group.style.color }}
                            classList={{ active: P.group.style.italic }}
                            onclick={() =>
                                set_style({ italic: !P.group.style.italic })
                            }
                        >
                            <ItalicIcon />
                        </button>
                        <button
                            class='action title_smaller '
                            // style={{ color: P.group.style.color }}
                            classList={{ active: P.group.style.underline }}
                            onclick={() =>
                                set_style({
                                    underline: !P.group.style.underline,
                                })
                            }
                        >
                            <UnderlineIcon />
                        </button>
                    </div>

                    <div class='actions-wrapper'>
                        <button
                            class='action'
                            classList={{ active: P.group.style.code }}
                            onclick={() =>
                                set_style({ code: !P.group.style.code })
                            }
                        >
                            <CodeXmlIcon />
                        </button>

                        <button
                            class='action'
                            classList={{ active: P.group.style.mark }}
                            onclick={() =>
                                set_style({ mark: !P.group.style.mark })
                            }
                        >
                            <HighlighterIcon />
                        </button>

                        <LinkButton idx={P.idx} ag={P.ag} group={P.group} />
                        <Action
                            title='تغییر فونت'
                            onAct={() =>
                                alert('selecting custom font\ncoming soon...')
                            }
                            icon={TypeIcon}
                        />
                        <Action
                            color='var(--yellow)'
                            onAct={reset}
                            icon={RotateCcwIcon}
                            title='بازنشانی'
                        />
                    </div>
                </div>
            </Show>
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
            <Tooltip
                children={
                    P.dir == 1 ? 'افزایش اندازه فونت' : 'کاهش اندازه فونت'
                }
            />
            <Show when={P.dir == 1} fallback={<AArrowDownIcon />}>
                <AArrowUpIcon />
            </Show>
        </button>
    )
}

type LinkButtonProps = {
    idx: number
    group: BlogTextGroup
    ag: number
}
const LinkButton: Component<LinkButtonProps> = P => {
    type State = {
        show: boolean
    }
    const [state, setState] = createStore<State>({
        show: false,
    })

    function set_url(url: string) {
        setStore(
            produce(s => {
                let g = (s.data[P.idx] as BlogText).groups[P.ag]
                g.url = url || null
            })
        )
    }

    return (
        <div class='text-link'>
            <button
                class='action'
                classList={{ active: state.show }}
                onclick={() => setState(s => ({ show: !s.show }))}
                style={{ color: P.group.url && 'var(--green)' }}
            >
                <LinkIcon />
            </button>
            <Show when={state.show}>
                <div class='link-input'>
                    <input
                        class='styled url'
                        placeholder='e.g. https://00-team.org'
                        value={P.group.url}
                        onInput={e => set_url(e.currentTarget.value)}
                        onChange={() => setState({ show: false })}
                    />
                </div>
            </Show>
        </div>
    )
}
