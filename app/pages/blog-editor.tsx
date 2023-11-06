import './style/blog-editor.scss'

export default () => {
    let editor: HTMLDivElement

    return (
        <div class='blog-editor-fnd'>
            <div class='header'>Header</div>
            <div class='content'>
                <div
                    class='editor'
                    ref={editor}
                    // tabindex={0}
                    // onfocus={() => {
                    //     let input = document.createElement('textarea')
                    //     input.setAttribute('tabindex', '0')
                    //     input.classList.add('hidden-input')
                    //     input.value = editor.innerText
                    //     input.oninput = () => {
                    //         editor.innerText = input.value
                    //     }
                    //     input.onblur = () => input.remove()
                    //
                    //     document.body.appendChild(input)
                    //     input.focus()
                    // }}
                >
                    <p
                        contenteditable
                        oninput={e => {
                            console.log(e.currentTarget.innerHTML)
                        }}
                    >
                        first part
                        <span>Secods part</span>
                        in bet
                        <b>bold</b>
                        after adasd
                    </p>
                </div>
                <div class='sidebar'>
                    <div class='config'>config</div>
                    <div class='actions'></div>
                </div>
            </div>
        </div>
    )
}
