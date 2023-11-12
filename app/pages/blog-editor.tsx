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
            { type: 'text', html: 'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS' },
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
            console.log(e)

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
