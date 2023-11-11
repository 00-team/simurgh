import { SetStoreFunction, createStore, produce } from 'solid-js/store'
import './style/blog-editor.scss'
import { Component, createSignal, onMount } from 'solid-js'
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
    active_block: number
}

// let observer: MutationObserver
export default () => {
    let editor: HTMLDivElement
    const [state, setState] = createStore<StateModel>({
        blocks: [
            { type: 'text', html: '' },
            DEFAULT_BLOCKS.empty,
            { type: 'text', html: 'asdasd<br/>sss' },
        ],
        active_block: 0,
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
                                active: i == state.active_block,
                                [b.type]: true,
                            }}
                            onMouseDown={() => setState({ active_block: i })}
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
                                    s.active_block = new_id - 1
                                })
                            )
                        }}
                    >
                        Add Block
                    </button>
                </div>
                <div class='sidebar'>
                    <div class='config'>config</div>
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
                onInput={e => {
                    setPlaceholder(!e.currentTarget.innerHTML)
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
