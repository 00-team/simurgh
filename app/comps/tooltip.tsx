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
        x?: number
        y?: number
        p?: number
        pb?: boolean
    }
    const [state, setState] = createStore<State>({
        show: false,
        pb: false,
    })

    function enter(e: { currentTarget: HTMLElement } & MouseEvent) {
        const p = e.currentTarget.getBoundingClientRect()
        setState({ show: true, x: ~~p.left, p: ~~(p.width / 2) })
        if (!tooltip) return
        const c = tooltip.getBoundingClientRect()
        if (p.top < c.height + 10) {
            setState({ y: ~~(p.bottom + 10), pb: true })
        } else {
            setState({ y: ~~(p.top - c.height - 10), pb: false })
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
                    <div
                        class='cmp-tooltip title_smaller'
                        ref={tooltip}
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
