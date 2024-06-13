// conf-act or confirm action :)

import './style/confact.scss'
import { Component, JSX, createEffect, createSignal } from 'solid-js'

type Props = {
    icon: () => JSX.Element
    timer_ms?: number
    onAct(): void
    color: string
    disabled?: boolean
}
const Confact: Component<Props> = P => {
    const [stage2, setStage2] = createSignal(false)
    let timeout = 0
    let timer = 0

    createEffect(() => {
        clearTimeout(timer)
        if (!stage2()) return
        timer = setTimeout(() => {
            setStage2(false)
        }, 10e3)
    })

    return (
        <button
            disabled={P.disabled}
            style={{ '--tsd': (P.timer_ms || 1000) + 'ms', '--color': P.color }}
            class='cmp-confact icon'
            classList={{ stage2: stage2() }}
            title={stage2() ? 'right click to unactivate' : 'hold to activate'}
            oncontextmenu={e => {
                e.preventDefault()
                setStage2(false)
            }}
            onmousedown={e => {
                timeout = 0
                if (stage2()) {
                    if (e.button != 0) {
                        setStage2(false)
                    }
                } else {
                    timeout = performance.now()
                }
            }}
            onmouseup={() => {
                if (stage2()) {
                    P.onAct()
                    setStage2(false)
                    return
                }

                if (!timeout) return
                if (performance.now() - timeout > (P.timer_ms || 1000)) {
                    setStage2(true)
                }
                timeout = 0
            }}
        >
            <P.icon />
        </button>
    )
}

export { Confact }
