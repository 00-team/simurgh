import { TrashIcon } from 'icons'

import './style/trash.scss'
import { Component, createSignal } from 'solid-js'

type Props = {
    timer_ms?: number
    onDelete(): void
}
const TrashButton: Component<Props> = P => {
    const [stage2, setStage2] = createSignal(false)
    let timeout = 0

    return (
        <button
            style={{ '--tsd': (P.timer_ms || 1000) + 'ms' }}
            class='cmp-trash-btn trash icon'
            classList={{ stage2: stage2() }}
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
                    P.onDelete()
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
            <TrashIcon />
        </button>
    )
}

export { TrashButton }
