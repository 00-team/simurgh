import { SetStoreFunction, createStore, produce } from 'solid-js/store'
import './style/blog-editor.scss'
import { Component, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { ImageIcon, TextIcon } from '!/icons/editor'

const CONTENT_IS_EDITABLE =
    // @ts-ignore checking for firefox
    typeof InstallTrigger !== 'undefined' ? true : 'plaintext-only'

type EmptyBlock = {
    type: 'empty'
}

type TextGroupData = {
    content: string[]
    style: {
        color?: string
        fontSize?: number
    }
}

type TextBlock = {
    type: 'text'
    data: TextGroupData[]
    active: number
    style: {
        direction?: 'ltr' | 'rtl'
    }
}

type ImageBlock = {
    type: 'image'
    url: string
    record_id: number
}

type Block = TextBlock | ImageBlock | EmptyBlock

const DEFAULT_BLOCKS: { [T in Block as T['type']]: T } = {
    empty: { type: 'empty' },
    text: {
        type: 'text',
        data: [],
        active: -1,
        style: {},
    },
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
            DEFAULT_BLOCKS.text,
            DEFAULT_BLOCKS.empty,
            {
                type: 'text',
                data: [
                    { content: ['01'], style: {} },
                    {
                        content: ['2345678abcdefg'],
                        style: { color: '#00ff00' },
                    },
                    { content: ['very cool'], style: {} },
                    { content: ['this is good stuff'], style: {} },
                ],
                active: -1,
                style: {},
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

const TextComp: BlockComponent<TextBlock> = P => {
    const [placeholder, setPlaceholder] = createSignal(!P.block.data.length)

    return (
        <>
            {placeholder() && <span class='placeholder'>Enter Text Here</span>}
            <p
                id={`block_paragraph_${P.id}`}
                onMouseDown={() => {
                    P.setState(
                        produce(s => {
                            // @ts-ignore
                            s.blocks[P.id].active = -1
                        })
                    )
                }}
                onInput={e => {
                    if (P.state.active.id != P.id) {
                        P.setState({
                            active: { id: P.id, type: P.block.type },
                        })
                    }
                    setPlaceholder(!e.currentTarget.innerHTML)
                }}
                onFocus={() => {
                    if (P.state.active.id != P.id) {
                        P.setState({
                            active: { id: P.id, type: P.block.type },
                        })
                    }
                }}
                contenteditable={CONTENT_IS_EDITABLE}
            >
                {P.block.data.map((g, i) => (
                    <span
                        data-style={JSON.stringify(g.style)}
                        style={{
                            color: g.style.color,
                            'font-size': g.style.fontSize + 'px',
                        }}
                        classList={{ active: P.block.active == i }}
                        onMouseDown={e => {
                            e.stopPropagation()
                            P.setState(
                                produce(s => {
                                    // @ts-ignore
                                    s.blocks[P.id].active = i
                                })
                            )
                        }}
                    >
                        {g.content.map((line, i1, a) => (
                            <>
                                {line}
                                {i1 != a.length - 1 ? <br /> : <></>}
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

const TextConf: BlockComponent<TextBlock> = P => {
    let id = P.state.active.id

    onCleanup(() => {
        P.setState(
            produce(s => {
                // @ts-ignore
                s.blocks[P.id].active = -1
            })
        )
    })

    function new_group(): TextGroupData[] | null {
        let p = editor.querySelector<HTMLParagraphElement>(
            '.block.text p#block_paragraph_' + id
        )
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
                        style:
                            JSON.parse(n.getAttribute('data-style') || '{}') ||
                            {},
                        content: [],
                    })
                }

                for (let e of n.childNodes) {
                    if (e == sc) {
                        groups.push(content.length + soff)
                        data.set(content.length + soff, {
                            style:
                                JSON.parse(
                                    n.getAttribute('data-style') || '{}'
                                ) || {},
                            content: [],
                        })
                        outrange = 0
                    }

                    if (!outrange && e == ec) {
                        groups.push(content.length + eoff)
                        data.set(content.length + eoff, {
                            style:
                                JSON.parse(
                                    n.getAttribute('data-style') || '{}'
                                ) || {},
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
                grouped_content.push({ content: c, style: {} })
            }

            last_g = g
            if (i == groups.length - 1) {
                let c = content.slice(last_g).split('\n')
                let d = data.get(last_g)

                if (d) {
                    grouped_content.push({ ...d, content: c })
                } else {
                    grouped_content.push({ content: c, style: {} })
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
                    console.log(res)

                    if (res !== null) {
                        P.setState(
                            produce(s => {
                                // @ts-ignore
                                s.blocks[P.id].data = res
                                console.log(s.blocks[P.id])
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
                    let p = editor.querySelector<HTMLParagraphElement>(
                        '.block.text p#block_paragraph_' + id
                    )

                    p.style.direction =
                        p.style.direction == 'rtl' ? 'ltr' : 'rtl'
                }}
            >
                Toggle Dir
            </button>
            <Show when={P.block.data[P.block.active]}>
                <TextGroupStyleConfig
                    style={P.block.data[P.block.active].style}
                    update={style => {
                        P.setState(
                            produce(s => {
                                let data =
                                    // @ts-ignore
                                    s.blocks[P.id].data[P.block.active].style
                                // @ts-ignore
                                s.blocks[P.id].data[P.block.active].style = {
                                    ...data,
                                    ...style,
                                }
                            })
                        )
                    }}
                />
            </Show>
        </div>
    )
}

type TGCProps = {
    style: TextGroupData['style']
    update: (data: Partial<TextGroupData['style']>) => void
}
const TextGroupStyleConfig: Component<TGCProps> = P => {
    return (
        <>
            <input
                name='group_color'
                type='color'
                value={P.style.color || '#ffffff'}
                onInput={e => {
                    let color = e.currentTarget.value
                    P.update({ color })
                }}
            />
            <input
                name='font_size'
                type='number'
                min={0}
                max={720}
                value={P.style.fontSize || 18}
                onInput={e => {
                    let value = e.currentTarget.value
                    if (!value) return
                    let size = parseInt(value)
                    if (size < 0 || size > 720) return
                    P.update({ fontSize: size })
                }}
            />
        </>
    )
}

const config_map: BlockMap = {
    empty: () => <></>,
    image: ImageConf,
    text: TextConf,
}
