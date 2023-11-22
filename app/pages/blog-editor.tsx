import { SetStoreFunction, createStore, produce } from 'solid-js/store'
import './style/blog-editor.scss'
import { Component, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { ImageIcon, TextIcon } from '!/icons/editor'
// import { onCleanup, onMount } from 'solid-js'

type EmptyBlock = {
    type: 'empty'
}

type TextGroupData = {
    content: string[]
    style?: string
}

type TextBlock = {
    type: 'text'
    data: TextGroupData[]
}

type ImageBlock = {
    type: 'image'
    url: string
    record_id: number
}

type Block = TextBlock | ImageBlock | EmptyBlock

const DEFAULT_BLOCKS: { [T in Block as T['type']]: T } = {
    empty: { type: 'empty' },
    text: { type: 'text', data: [] },
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
            { type: 'text', data: [] },
            DEFAULT_BLOCKS.empty,
            {
                type: 'text',
                data: [
                    { content: ['01'] },
                    { content: ['2345678abcdefg'], style: 'color: lime;' },
                    { content: ['very cool'] },
                    { content: ['this is good stuff'] },
                ],
            },
        ],
        active: {
            id: 2,
            type: 'text',
        },
    })

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
                                setState(
                                    produce(s => {
                                        s.active.id = i
                                        s.active.type = b.type
                                    })
                                )
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
    const [placeholder, setPlaceholder] = createSignal(!props.block.data.length)

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
                contenteditable={
                    // @ts-ignore checking for firefox
                    typeof InstallTrigger !== 'undefined'
                        ? true
                        : 'plaintext-only'
                }
            >
                {props.block.data.map(g => (
                    <span style={g.style}>
                        {g.content.map((line, i, a) => (
                            <>
                                {line}
                                {i != a.length - 1 ? <br /> : <></>}
                            </>
                        ))}
                    </span>
                ))}
            </p>
        </>
    )
}

const ImageComp: BlockComponent<ImageBlock> = props => {
    return <>IMAGE - {props.id}</>
}

const block_map: BlockMap = {
    empty: EmptyComp,
    text: TextComp,
    image: ImageComp,
}

const ImageConf: BlockComponent<ImageBlock> = props => {
    return <>{props.block.type}</>
}

const TextConf: BlockComponent<TextBlock> = props => {
    let id = props.state.active.id
    let p = editor.querySelector<HTMLParagraphElement>(
        '.block.text p#block_paragraph_' + id
    )
    type Target = {
        span: HTMLSpanElement | null
    }
    const [target, setTarget] = createStore<Target>({ span: null })

    onMount(() => {
        // p.querySelectorAll('span').forEach(e => {
        //     e.onmousedown = () => {
        //         setTarget(
        //             produce(s => {
        //                 if (s.span) s.span.classList.remove('active')
        //                 s.span = e
        //             })
        //         )
        //         e.classList.add('active')
        //     }
        // })

        /*
        document.onselectionchange = () => {
            let s = document.getSelection()
            if (!s.rangeCount) return
            let r = s.getRangeAt(0)
            if (!r.collapsed) return
            let node = r.startContainer

            console.log(node, node.parentElement, p.contains(node))

            if (!p.contains(node)) {
                // if (p.contentEditable == 'false') {
                //     // @ts-ignore checking for firefox
                //     if (typeof InstallTrigger !== 'undefined') {
                //         p.contentEditable = 'true'
                //     } else {
                //         p.contentEditable = 'plaintext-only'
                //     }
                // }

                return
            }

            if (node instanceof HTMLSpanElement) {
                // p.contentEditable = 'false'
                setTarget({ span: node })
                return
            }

            if (node.parentElement instanceof HTMLSpanElement) {
                // p.contentEditable = 'false'
                setTarget({ span: node.parentElement })
                return
            }

            setTarget({ span: null })

            // if (!target.span) {
            //     if (p.contentEditable == 'false') {
            //         // @ts-ignore checking for firefox
            //         if (typeof InstallTrigger !== 'undefined') {
            //             p.contentEditable = 'true'
            //         } else {
            //             p.contentEditable = 'plaintext-only'
            //         }
            //     }
            //
            //     return
            // }
        }
        */

        p.onmousedown = e => {
            p.querySelectorAll('span').forEach(e => {
                e.classList.remove('active')
            })

            if (e.target instanceof HTMLSpanElement) {
                e.target.classList.add('active')
                setTarget({ span: e.target })
            } else {
                setTarget({ span: null })
            }
        }
    })

    onCleanup(() => {
        console.log('cleanup')
        p.querySelectorAll('span').forEach(e => {
            e.classList.remove('active')
        })
        p.onmousedown = null
        p.onclick = null
        document.onselectionchange = null
    })

    function new_group(): TextGroupData[] | null {
        let selection = document.getSelection()
        if (!selection.rangeCount) return null
        let range = selection.getRangeAt(0)
        if (range.collapsed) return null

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
        let data: Map<number, TextGroupData> = new Map()
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
                if (outrange) {
                    groups.push(content.length)
                    data.set(content.length, {
                        style: n.getAttribute('style'),
                        content: [],
                    })
                }

                for (let e of n.childNodes) {
                    if (e == sc) {
                        groups.push(content.length + soff)
                        outrange = 0
                    }

                    if (!outrange && e == ec) {
                        groups.push(content.length + eoff)
                        data.set(content.length + eoff, {
                            style: n.getAttribute('style'),
                            content: [],
                        })
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

        let grouped_content: TextGroupData[] = []

        let last_g = 0
        for (let [i, g] of groups.entries()) {
            let c = content.slice(last_g, g).split('\n')
            let d = data.get(last_g)

            if (d) {
                grouped_content.push({ ...d, content: c })
            } else {
                grouped_content.push({ style: '', content: c })
            }

            last_g = g
            if (i == groups.length - 1) {
                let c = content.slice(last_g).split('\n')
                let d = data.get(last_g)

                if (d) {
                    grouped_content.push({ ...d, content: c })
                } else {
                    grouped_content.push({ style: '', content: c })
                }
            }
        }

        return grouped_content

        // p.innerHTML = ''
        // grouped_content.forEach(g => {
        //     console.log(g)
        //     if (!g.content.length || (g.content.length == 1 && !g.content[0]))
        //         return
        //
        //     let span = document.createElement('span')
        //     span.id = 'g' + p.childNodes.length
        //     span.setAttribute('style', g.style)
        //     g.content.forEach((t, i, a) => {
        //         span.append(t)
        //         if (i === a.length - 1) return
        //         span.append(document.createElement('br'))
        //     })
        //     p.append(span)
        // })
    }

    return (
        <div class='text' onMouseEnter={() => {}}>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => {
                    let res = new_group()

                    if (res !== null) {
                        props.setState(
                            produce(s => {
                                // @ts-ignore
                                s.blocks[props.id].data = res
                            })
                        )
                    }
                }}
            >
                new Group
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
            <Show when={target.span != null}>
                <input
                    type='color'
                    value={
                        target.span.style.color
                            ? '#' +
                              target.span.style.color
                                  .slice(4, -1)
                                  .split(', ')
                                  .map(i =>
                                      parseInt(i).toString(16).padStart(2, '0')
                                  )
                                  .join('')
                            : '#ffffff'
                    }
                    onInput={e => {
                        let color = e.currentTarget.value
                        target.span.style.color = color
                    }}
                />
                <input
                    type='number'
                    min={0}
                    max={720}
                    value={
                        target.span.style.fontSize
                            ? target.span.style.fontSize.slice(0, -2)
                            : 18
                    }
                    onInput={e => {
                        let value = e.currentTarget.value
                        if (!value) return
                        let size = parseInt(value)
                        if (size < 0 || size > 720) return
                        target.span.style.fontSize = size + 'px'
                    }}
                />
            </Show>
        </div>
    )
}

const config_map: BlockMap = {
    empty: () => <></>,
    image: ImageConf,
    text: TextConf,
}
