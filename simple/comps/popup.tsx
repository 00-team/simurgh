import { Component, JSX, Show, createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Portal } from 'solid-js/web'

import './style/popup.scss'

type ChildProps = {
    parent: HTMLElement
}

type Props = {
    show: boolean
    children: JSX.Element
    getProps?(props: ChildProps): void
}
export const Popup: Component<Props> = P => {
    let decoy: HTMLDivElement
    let popup: HTMLDivElement

    type State = {
        x?: number
        y?: number
        p?: number
        pb?: boolean
    }
    const [state, setState] = createStore<State>({
        pb: false,
    })

    createEffect(() => {
        if (!decoy || !P.getProps) return
        P.getProps({ parent: decoy.parentElement })
    })

    createEffect(() => {
        if (!P.show) return
        const p = decoy.parentElement.getBoundingClientRect()
        setState({ x: ~~p.left, p: ~~(p.width / 2) })

        if (!popup) return
        const c = popup.getBoundingClientRect()
        if (p.top < c.height + 10) {
            setState({ y: ~~(p.bottom + 10), pb: true })
        } else {
            setState({ y: ~~(p.top - c.height - 10), pb: false })
        }
    })

    return (
        <div class='cmp-popup-decoy' ref={decoy}>
            <Show when={P.show}>
                <Portal>
                    <div
                        class='cmp-popup'
                        ref={popup}
                        classList={{ bottom: state.pb }}
                        style={{
                            top: state.y + 'px',
                            left: state.x + 'px',
                            '--after-offset': state.p + 'px',
                        }}
                    >
                        {P.children}
                    </div>
                </Portal>
            </Show>
        </div>
    )
}
