import { Component, JSX, Show, onCleanup, onMount } from 'solid-js'

import './style/tooltip.scss'
import { createStore } from 'solid-js/store'
import { Portal } from 'solid-js/web'

type Props = {
    children: JSX.Element
}
export const Tooltip: Component<Props> = P => {
    let decoy: HTMLDivElement
    let tooltip: HTMLDivElement

    type State = {
        show: boolean
        top?: string
        bottom?: string
        left?: string
        right?: string
    }
    const [state, setState] = createStore<State>({
        show: false,
    })

    function enter(e: { currentTarget: HTMLElement } & MouseEvent) {
        setState({ show: true })
        if (!tooltip) return
        const p = e.currentTarget.getBoundingClientRect()
        const c = tooltip.getBoundingClientRect()
        if (p.top < c.height) {
            setState({ top: p.bottom + 'px', left: p.left + 'px' })
        } else {
            setState({ top: p.top - c.height - 10 + 'px', left: p.left + 'px' })
        }
    }

    function leave() {
        setState({ show: false })
    }

    onMount(() => {
        decoy.parentElement.addEventListener('mouseenter', enter)
        decoy.parentElement.addEventListener('mouseleave', leave)
    })

    onCleanup(() => {
        decoy.parentElement.removeEventListener('mouseenter', enter)
        decoy.parentElement.removeEventListener('mouseleave', leave)
    })

    return (
        <div class='cmp-tooltip-decoy' ref={decoy}>
            <Show when={state.show}>
                <Portal>
                    <div class='cmp-tooltip' ref={tooltip} style={{ ...state }}>
                        {P.children}
                    </div>
                </Portal>
            </Show>
        </div>
    )
}
