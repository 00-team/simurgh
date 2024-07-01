import { Component, JSX, createEffect, onCleanup } from 'solid-js'
import { Popup } from './popup'
import { createStore } from 'solid-js/store'

type Props = {
    children: JSX.Element
}
export const Tooltip: Component<Props> = P => {
    type State = {
        show: boolean
        parent?: HTMLElement
    }
    const [state, setState] = createStore<State>({
        show: false,
    })

    function leave() {
        setState({ show: false })
    }

    function enter() {
        setState({ show: true })
    }

    createEffect(() => {
        if (!state.parent) return

        state.parent.addEventListener('mouseenter', enter)
        state.parent.addEventListener('mouseleave', leave)
    })

    onCleanup(() => {
        if (!state.parent) return

        state.parent.removeEventListener('mouseenter', enter)
        state.parent.removeEventListener('mouseleave', leave)
    })

    return (
        <Popup
            show={state.show}
            getProps={p => {
                setState({ parent: p.parent })
            }}
        >
            {P.children}
        </Popup>
    )
}
