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
            { type: 'text', html: 'asdasd<br/>sss' },
        ],
        active: {
            id: 0,
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

const TextConf: BlockComponent<TextBlock> = props => {
    let id = props.state.active.id
    let p = editor.querySelector<HTMLParagraphElement>(
        '.block.text p#block_paragraph_' + id
    )
    function surround(tag: 'b' | 'em' | 'u') {
        let selection = document.getSelection()

        let wrap: Node = document.createElement(tag)
        let range = selection.getRangeAt(0)

        let content = range.extractContents()
        content.childNodes.forEach(e => {
            if (e.nodeType === Node.TEXT_NODE && !e.textContent) e.remove()
        })

        if (!content.childNodes.length) return

        function check_nodes(n: Node): boolean {
            // n.childNodes.forEach(e => {
            // if (e.nodeType === Node.TEXT_NODE && !e.textContent) e.remove()
            // if (e.nodeName !== 'BR' && !e.childNodes.length) e.remove()
            // })

            if (n.childNodes.length != 1) return false

            let target = n.childNodes[0]

            if (target.nodeName === tag.toUpperCase()) {
                wrap = document.createDocumentFragment()
                let frag = document.createDocumentFragment()
                target.childNodes.forEach(e => frag.appendChild(e.cloneNode()))
                n.appendChild(frag)
                target.remove()
                return true
            } else {
                check_nodes(target)
            }
        }

        check_nodes(content)
        if (!content.childNodes.length) return
        wrap.appendChild(content)
        range.insertNode(wrap)
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
                onClick={() => surround('b')}
            >
                BOLD
            </button>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => surround('em')}
            >
                Italic
            </button>
            <button
                onmousedown={e => e.preventDefault()}
                onClick={() => surround('u')}
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
