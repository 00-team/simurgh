import { SetStoreFunction, createStore, produce } from 'solid-js/store'
import './style/blog-editor.scss'
import {
    Component,
    Show,
    createEffect,
    createSignal,
    onCleanup,
    onMount,
} from 'solid-js'
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
                html: `01<span><br/><br/>2345678<br/></span>very cool<span>ass<br />asdas</span>asd`,
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
                contenteditable={
                    // @ts-ignore checking for firefox
                    typeof InstallTrigger !== 'undefined'
                        ? true
                        : 'plaintext-only'
                }
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

const TextConf: BlockComponent<TextBlock> = props => {
    let id = props.state.active.id
    let p = editor.querySelector<HTMLParagraphElement>(
        '.block.text p#block_paragraph_' + id
    )
    const [target, setTarget] = createStore<{ span: HTMLSpanElement | null }>(
        null
    )

    onMount(() => {
        document.onselectionchange = () => {
            let s = document.getSelection()
            if (!s.rangeCount) return
            let r = s.getRangeAt(0)
            if (!r.collapsed) return
            let node = r.startContainer

            console.log(node, node.parentElement)

            setTarget({ span: null })

            if (!p.contains(node)) return

            if (node instanceof HTMLSpanElement) {
                setTarget({
                    span: document.querySelector(
                        `.block.text p#block_paragraph_${id} span#g${node.id}`
                    ),
                })
                return
            }

            if (node.parentElement instanceof HTMLSpanElement) {
                setTarget({
                    span: document.querySelector(
                        `.block.text p#block_paragraph_${id} span#g${node.parentElement.id}`
                    ),
                })
                return
            }
        }

        // p.onclick = e => {
        //     if (e.target instanceof HTMLSpanElement) {
        //         setTarget({ span: e.target })
        //     } else {
        //         setTarget({ span: null })
        //     }
        // }
    })

    onCleanup(() => {
        // p.onclick = null
        document.onselectionchange = null
    })

    function new_group() {
        let selection = document.getSelection()
        if (!selection.rangeCount) return
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

        type GroupData = {
            style: string
        }

        let content = ''
        let groups: number[] = []
        let data: GroupData[] = []
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
            } else if (n.nodeName == 'SPAN') {
                if (outrange) {
                    groups.push(content.length)
                }

                for (let e of n.childNodes) {
                    if (e == sc) {
                        groups.push(content.length + soff)
                        outrange = 0
                    }

                    if (!outrange && e == ec) {
                        groups.push(content.length + eoff)
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

        let grouped_content: string[][] = []

        let last_g = 0
        for (let [i, g] of groups.entries()) {
            grouped_content.push(content.slice(last_g, g).split('\n'))
            last_g = g
            if (i == groups.length - 1) {
                grouped_content.push(content.slice(last_g).split('\n'))
            }
        }

        p.innerHTML = ''
        grouped_content.forEach(g => {
            if (!g.length || (g.length == 1 && !g[0])) return

            let span = document.createElement('span')
            span.id = 'g' + p.childNodes.length
            g.forEach((t, i) => {
                span.append(t)
                if (i === g.length - 1) return
                span.append(document.createElement('br'))
            })
            p.append(span)
        })
    }

    return (
        <div class='text'>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => new_group()}
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
                    onInput={e => {
                        let color = e.currentTarget.value
                        target.span.setAttribute('style', `color:${color};`)
                        // target.span.style.color = e.currentTarget.value
                        // console.log(span)
                        // target.style.setProperty('color', e.currentTarget.value)
                        // target.style = 'color: ' + e.currentTarget.value
                        // target.style.color = e.currentTarget.value
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
