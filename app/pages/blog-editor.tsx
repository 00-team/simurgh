import { SetStoreFunction, createStore, produce } from 'solid-js/store'
import './style/blog-editor.scss'
import { Component, createEffect, createSignal, onMount } from 'solid-js'
import { ImageIcon, TextIcon } from '!/icons/editor'
// import { onCleanup, onMount } from 'solid-js'

type EmptyBlock = {
    type: 'empty'
}

type TextBlock = {
    type: 'text'
    html: string
}

type ImageBlock = {
    type: 'image'
    url: string
    record_id: number
}

type Block = TextBlock | ImageBlock | EmptyBlock

const DEFAULT_BLOCKS: { [T in Block as T['type']]: T } = {
    empty: { type: 'empty' },
    text: { type: 'text', html: '' },
    image: { type: 'image', url: '', record_id: -1 },
}

type BlockCosmetic = {
    title: string
    icon: Component
}

type BlockCosmeticMap = Omit<
    { [T in Block as T['type']]: BlockCosmetic },
    'empty'
>
const BLOCK_COSMETIC: BlockCosmeticMap = {
    text: { title: 'Text', icon: TextIcon },
    image: { title: 'Image', icon: ImageIcon },
}

type StateModel = {
    blocks: Block[]
    active: {
        id: number
        type: Block['type']
    }
}

let editor: HTMLDivElement
export default () => {
    const [state, setState] = createStore<StateModel>({
        blocks: [
            { type: 'text', html: '' },
            DEFAULT_BLOCKS.empty,
            {
                type: 'text',
                // html: `12<br /><br /><br /><br />345<br /><br /><br /><br />213`,
                html: `12<span>asdadada</span>asdasdadads123123<span>ass<br />asdasd </span> asd`,
            },
        ],
        active: {
            id: 2,
            type: 'text',
        },
    })

    // onMount(() => {})
    // onCleanup(() => {})

    return (
        <div class='blog-editor-fnd'>
            <div class='header'>Header</div>
            <div class='content'>
                <div class='editor' ref={editor}>
                    {state.blocks.map((b, i) => (
                        <div
                            class='block'
                            classList={{
                                active: i == state.active.id,
                                [b.type]: true,
                            }}
                            onMouseDown={() =>
                                setState({ active: { id: i, type: b.type } })
                            }
                        >
                            {block_map[b.type]({
                                setState,
                                state,
                                block: b as never,
                                id: i,
                            })}
                        </div>
                    ))}
                    <button
                        onclick={() => {
                            setState(
                                produce(s => {
                                    let new_id = s.blocks.push({
                                        type: 'empty',
                                    })
                                    s.active.id = new_id - 1
                                    s.active.type = 'empty'
                                })
                            )
                        }}
                    >
                        Add Block
                    </button>
                </div>
                <div class='sidebar'>
                    <div class='config'>
                        {config_map[state.active.type]({
                            state,
                            setState,
                            id: state.active.id,
                            block: state.blocks[state.active.id] as never,
                        })}
                    </div>
                    <div class='actions'></div>
                </div>
            </div>
        </div>
    )
}

type BlockComponent<T extends Block> = Component<{
    state: StateModel
    setState: SetStoreFunction<StateModel>
    block: T
    id: number
}>

type BlockMap = {
    [T in Block as T['type']]: BlockComponent<T>
}

const EmptyComp: BlockComponent<EmptyBlock> = props => {
    return (
        <>
            <span>Select the Block Type:</span>
            <div class='blocks'>
                {Object.entries(BLOCK_COSMETIC).map(([t, c]) => (
                    <button
                        class='select-btn'
                        onclick={() => {
                            props.setState(
                                produce(s => {
                                    s.blocks[props.id] = DEFAULT_BLOCKS[t]
                                    s.active.type = t as Block['type']
                                })
                            )
                        }}
                    >
                        {c.icon({})}
                        {c.title}
                    </button>
                ))}
            </div>
        </>
    )
}

const TextComp: BlockComponent<TextBlock> = props => {
    const [placeholder, setPlaceholder] = createSignal(!props.block.html)

    return (
        <>
            {placeholder() && <span class='placeholder'>Enter Text Here</span>}
            <p
                id={`block_paragraph_${props.id}`}
                onInput={e => {
                    if (props.state.active.id != props.id) {
                        props.setState({
                            active: { id: props.id, type: props.block.type },
                        })
                    }
                    setPlaceholder(!e.currentTarget.innerHTML)
                }}
                onFocus={() => {
                    if (props.state.active.id != props.id) {
                        props.setState({
                            active: { id: props.id, type: props.block.type },
                        })
                    }
                }}
                contenteditable={true}
                onBlur={e => {
                    props.setState(
                        produce(s => {
                            // @ts-ignore
                            s.blocks[props.id].html = e.currentTarget.innerHTML
                        })
                    )
                }}
                innerHTML={props.block.html}
            ></p>
        </>
    )
}

const ImageComp: BlockComponent<ImageBlock> = props => {
    return <>IMAGE</>
}

const block_map: BlockMap = {
    empty: EmptyComp,
    text: TextComp,
    image: ImageComp,
}

const ImageConf: BlockComponent<ImageBlock> = props => {
    return <>{props.block.type}</>
}

var nnn = 0
const TextConf: BlockComponent<TextBlock> = props => {
    let id = props.state.active.id
    let p = editor.querySelector<HTMLParagraphElement>(
        '.block.text p#block_paragraph_' + id
    )

    function group() {
        type ContentStr = string | ContentStr[]
        let test = [
            '000000',
            '\n',
            ['222000', '222111', '\n', '222333'],
            '333333',
            '\n',
            ['555000', '555111', '\n', '555333'],
        ]

        type SliceIdx = ([number, number] | [number])[]

        let sl: SliceIdx = [[2, 4], [1, 0], [3]]

        function rec_splice(
            arr: ContentStr,
            idx: SliceIdx
        ): [ContentStr, ContentStr] {
            let [b, f] = idx.shift()
            if (idx.length) {
                let [s, e] = rec_splice(arr[i], idx)
                console.log(s, e, i)

                // if (typeof s === 'string') s = [s]
                // if (typeof e === 'string') e = [e]

                return [
                    [...arr.slice(0, i), s],
                    [e, ...arr.slice(i + 1)],
                ]
            } else {
                // FIXME: this is wrong
                return [arr.slice(0, b), arr.slice(b, f), arr.slice()]
            }
        }

        console.log(test, [...sl], rec_splice(test, sl))

        return

        let selection = document.getSelection()
        if (!selection.rangeCount) return
        let range = selection.getRangeAt(0)
        if (range.collapsed) return

        let sc = range.startContainer
        let ec = range.endContainer

        function add(node: Node): ContentStr {
            if (node.nodeType == Node.TEXT_NODE) {
                return node.textContent
            } else if (node.nodeName === 'BR') {
                return '\n'
            } else if (node.nodeName === 'SPAN') {
                return Array.from(node.childNodes).map(add)
            }
        }

        let content = Array.from(p.childNodes).map(add)
        let start_index: number[] = []
        let start_offset = range.startOffset

        let end_index: number[] = []
        let end_offset = range.endOffset

        if (sc == p) {
            sc = p.childNodes[start_offset]
            start_offset = 0
        }
        if (ec == p) {
            ec = p.childNodes[end_offset]
            end_offset = 0
        }

        function idx(node: Node, target: Node): number[] {
            for (let [i, n] of node.childNodes.entries()) {
                if (n == target) {
                    return [i]
                }

                if (n.contains(target)) {
                    return [i, ...idx(n, target)]
                }
            }

            throw new Error('unreachable')
        }

        for (let [i, n] of p.childNodes.entries()) {
            if (n == sc) {
                start_index = [i, start_offset]
            } else if (n.contains(sc)) {
                start_index = [i, ...idx(n, sc), start_offset]
            }

            if (n == ec) {
                end_index = [i, end_offset]
            } else if (n.contains(ec)) {
                end_index = [i, ...idx(n, ec), end_offset]
            }
        }

        console.log(content)
        console.log('-------')
        console.log(start_index)
        console.log('-------')
        console.log(end_index)

        // let start: string[] = []
        // let middle: string[] = []
        // let end: string = []
        //
        // let halfway: -1 | 0 | 1 = -1
        // for (let [i, c] of content.entries()) {
        //     if (i == start_index[0]) {
        //         halfway = 0
        //     }
        //
        //     if (halfway == -1) {
        //         start.push(c)
        //     } else if (halfway == 0) {
        //         middle.push(c)
        //     } else {
        //         end.push(c)
        //     }
        // }

        return

        let i = 0
        let start_idx = 0
        let start_pos = 0
        let end_idx = 0
        let end_pos = 0

        if (sc == p) sc = p.childNodes[range.startOffset]
        if (ec == p) ec = p.childNodes[range.endOffset]

        for (let n of p.childNodes) {
            if (n.nodeType === Node.TEXT_NODE) {
                content[i] += n.textContent
            } else if (n.nodeName === 'BR') {
                content[i] += '\n'
            } else if (n.nodeName === 'SPAN') {
                content.push('')
                i++
                n.childNodes.forEach(e => {
                    if (e.nodeType === Node.TEXT_NODE) {
                        content[i] += e.textContent
                    } else if (e.nodeName === 'BR') {
                        content[i] += '\n'
                    }
                })
                content.push('')
                i++
            }

            if (n === sc || n.contains(sc)) {
                start_idx = i
                if (n.nodeName == 'SPAN') start_idx--

                if (n === sc) {
                    start_pos = range.startOffset
                } else {
                    for (let e of n.childNodes) {
                        if (e == sc) {
                            start_pos += range.startOffset
                            break
                        }

                        if (e.nodeType === Node.TEXT_NODE) {
                            start_pos += e.textContent.length
                        } else if (e.nodeName === 'BR') {
                            start_pos += 1
                        }
                    }
                }
            }

            if (n === ec || n.contains(ec)) {
                end_idx = i
                if (n.nodeName == 'SPAN') end_idx--

                if (n === ec) {
                    end_pos = range.endOffset
                } else {
                    for (let e of n.childNodes) {
                        if (e == ec) {
                            end_pos += range.endOffset
                            break
                        }

                        if (e.nodeType === Node.TEXT_NODE) {
                            end_pos += e.textContent.length
                        } else if (e.nodeName === 'BR') {
                            end_pos += 1
                        }
                    }
                }
            }
        }

        console.log(content)
        let new_content = []
        let x = -1
        console.log(start_idx, start_pos)
        console.log(end_idx, end_pos)
        content.forEach((g, i) => {
            if (i == start_idx) {
                new_content.push(g.slice(0, start_pos))
                if (i == end_idx) {
                    new_content.push(g.slice(start_pos, end_pos))
                    new_content.push(g.slice(end_pos))
                } else {
                    x = new_content.push(g.slice(start_pos)) - 1
                }
            } else if (i == end_idx) {
                console.log('end', new_content[x], g)
                new_content[x] += g.slice(0, end_pos)
                new_content.push(g.slice(end_pos))
                x = -1
            } else if (x > -1) {
                new_content[x] += g
            } else {
                new_content.push(g)
            }
        })
        console.log(new_content)

        // let g = document.createElement('span')
        // let sp = range.startContainer.parentElement
        // let ep = range.endContainer.parentElement
        // let frag = document.createDocumentFragment()
        // let end: HTMLSpanElement
        // let start: HTMLSpanElement
        // let p = sp as HTMLParagraphElement
        //
        // console.log(range.startOffset, range.endOffset)
        //
        // if (sp.tagName == 'SPAN') {
        //     p = sp.parentElement as HTMLParagraphElement
        //     start = sp.cloneNode(false) as HTMLSpanElement
        //     for (let n of sp.childNodes) {
        //         if (n === range.startContainer) {
        //             if (range.startOffset) {
        //                 start.append(n.textContent.slice(0, range.startOffset))
        //             }
        //             break
        //         }
        //
        //         start.appendChild(n.cloneNode(true))
        //     }
        // }
        //
        // if (ep.tagName == 'SPAN') {
        //     end = ep.cloneNode(false) as HTMLSpanElement
        //     console.log(ep.cloneNode(true), range.endContainer.cloneNode(true))
        //     console.log('-------')
        //     let append = false
        //     for (let n of ep.childNodes) {
        //         if (append) end.appendChild(n.cloneNode(true))
        //
        //         if (n === range.endContainer) {
        //             end.append(n.textContent.slice(range.startOffset))
        //             append = true
        //         }
        //     }
        //     console.log('-------')
        //     console.log(end.cloneNode(true))
        // }
        //
        // let content = range.extractContents()
        // content.childNodes.forEach(n => {
        //     if (n.nodeName === 'SPAN') {
        //         n.replaceWith(...n.childNodes)
        //     }
        // })
        //
        // g.appendChild(content)
        //
        // if (start) frag.appendChild(start)
        // frag.appendChild(g)
        // if (end) frag.appendChild(end)
        //
        // if (sp.nodeName == 'SPAN') sp.replaceWith(frag)
        // else range.insertNode(frag)

        // console.log(range.startContainer, sp, range.startOffset)

        // if (sp === ep) {
        //     if (sp.tagName === 'SPAN') {
        //         let start = sp.cloneNode(false) as HTMLSpanElement
        //         let end = ep.cloneNode(false) as HTMLSpanElement
        //         let last = false
        //         let content = range.extractContents()
        //
        //         for (let n of sp.childNodes) {
        //             if (n === range.startContainer) {
        //                 last = true
        //                 if (range.startOffset) {
        //                     start.append(
        //                         n.textContent.slice(0, range.startOffset)
        //                     )
        //                     n = document.createTextNode(
        //                         n.textContent.slice(range.startOffset)
        //                     )
        //                 }
        //             }
        //
        //             if (last) {
        //                 end.appendChild(n)
        //             } else {
        //                 start.appendChild(n)
        //             }
        //         }
        //

        //
        //         let frag = document.createDocumentFragment()
        //         frag.append(start, g, end)
        //
        //         if (!start.innerHTML) start.remove()
        //         if (!end.innerHTML) end.remove()
        //
        //         sp.parentElement.insertBefore(frag, sp)
        //
        //         sp.remove()
        //         ep.remove()
        //     } else {
        //         let content = range.extractContents()
        //         content.childNodes.forEach(n => {
        //             if (n.nodeName === 'SPAN') {
        //                 n.replaceWith(...n.childNodes)
        //             }
        //         })
        //         g.appendChild(content)
        //         range.insertNode(g)
        //     }
        // } else {
        //     console.log('NOT IMPELEMENTED')
        // }
    }

    function surround(style: Partial<CSSStyleDeclaration>) {
        nnn++
        let selection = document.getSelection()

        // let wrap = document.createElement('span')
        // wrap.id = 'x_' + nnn
        let range = selection.getRangeAt(0)

        let content = range.extractContents()
        let container = document.createDocumentFragment()

        function is_span(node: Node): node is HTMLSpanElement {
            return node.nodeName === 'SPAN'
        }

        function apply_style(element: HTMLElement) {
            Object.entries(style).forEach(([k, v]) => {
                element.style.setProperty(k, `${v}`)
            })
        }

        content.childNodes.forEach(element => {
            let e = element.cloneNode()
            // console.log(e)

            if (e.nodeType === Node.TEXT_NODE) {
                let p = document.createElement('span')
                p.className = '1'
                p.appendChild(e)
                apply_style(p)
                container.appendChild(p)
            } else if (is_span(e)) {
                apply_style(e)
                container.appendChild(e)
            } else {
                container.appendChild(e)
            }
        })

        range.insertNode(container)

        // console.log('===============')
        // console.log(
        //     selection.anchorNode.cloneNode(),
        //     selection.anchorNode.parentNode.cloneNode()
        // )
        // console.log(
        //     selection.focusNode.cloneNode(),
        //     selection.focusNode.parentNode.cloneNode()
        // )
        // console.log('------------------------------')
        // content.childNodes.forEach(e => {
        //     console.log(e.cloneNode())
        // })
        // wrap.appendChild(content)
        // range.insertNode(wrap)
        // console.log(content.textContent)

        // content.childNodes.forEach(e => {
        //     if (e.nodeType === Node.TEXT_NODE && !e.textContent) {
        //         console.log(e.cloneNode())
        //         e.remove()
        //     }
        // })

        // if (!content.childNodes.length) return

        // function check_nodes(n: Node): boolean {
        //     if (n.childNodes.length != 1) return false
        //
        //     let target = n.childNodes[0]
        //
        //     if (target.nodeName === tag.toUpperCase()) {
        //         wrap = document.createDocumentFragment()
        //         let frag = document.createDocumentFragment()
        //         target.childNodes.forEach(e => frag.appendChild(e.cloneNode()))
        //         n.appendChild(frag)
        //         target.remove()
        //         return true
        //     } else {
        //         check_nodes(target)
        //     }
        // }
        //
        // check_nodes(content)
        // if (!content.childNodes.length) return
        // wrap.appendChild(content)
        // range.insertNode(wrap)
    }

    function clear() {
        let selection = document.getSelection()
        let range = selection.getRangeAt(0)
        let content = range.extractContents()
        let new_content = document.createDocumentFragment()

        function update_content(n: Node) {
            n.childNodes.forEach(e => {
                if (e.nodeType === Node.TEXT_NODE || e.nodeName === 'BR') {
                    new_content.appendChild(e.cloneNode())
                } else {
                    update_content(e)
                }
            })
        }

        update_content(content)
        range.insertNode(new_content)
    }

    return (
        <div class='text'>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => clear()}
            >
                Clear
            </button>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => group()}
            >
                new Group
            </button>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => surround({ fontSize: '20px' })}
            >
                BOLD
            </button>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => surround({ fontStyle: 'italic' })}
            >
                Italic
            </button>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => surround({ color: 'red' })}
            >
                Underline
            </button>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => {
                    p.style.direction =
                        p.style.direction == 'rtl' ? 'ltr' : 'rtl'
                }}
            >
                Toggle Dir
            </button>
        </div>
    )
}

const config_map: BlockMap = {
    empty: () => <></>,
    image: ImageConf,
    text: TextConf,
}
