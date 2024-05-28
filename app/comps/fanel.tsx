import { XIcon } from 'icons'
import { Component, JSX, Show } from 'solid-js'

import './style/fanel.scss'

type Props = {
    open: boolean
    onClose(): void
    children: JSX.Element
}
export const Fanel: Component<Props> = P => {
    return (
        <Show when={P.open}>
            <div class='cmp-fanel-fnd'>
                <div class='fanel'>
                    <button
                        class='styled icon cmp-fanel-btn-close'
                        onclick={P.onClose}
                    >
                        <XIcon />
                    </button>
                    {P.children}
                </div>
            </div>
        </Show>
    )
}
