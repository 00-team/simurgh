import { createStore, produce } from 'solid-js/store'
import './style/blog-editor.scss'
import { onCleanup, onMount } from 'solid-js'

// let observer: MutationObserver
export default () => {
    let editor: HTMLDivElement
    const [state, setState] = createStore({
        blocks: [{}, {}],
    })

    onMount(() => {
        // observer = new MutationObserver(() => {
        //     setState({ html: editor.innerHTML })
        // })
        //
        // observer.observe(editor, {
        //     subtree: true,
        //     childList: true,
        //     characterData: true,
        // })
    })

    onCleanup(() => {
        // observer.disconnect()
    })

    return (
        <div class='blog-editor-fnd'>
            <div class='header'>Header</div>
            <div class='content'>
                <div class='editor' ref={editor}>
                    {state.blocks.map((_, i) => (
                        <div class='block'>
                            <p contenteditable>block number: {i}</p>
                        </div>
                    ))}
                    <button
                        onclick={() => {
                            setState(
                                produce(s => {
                                    s.blocks.push({})
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
