import { CircleAlertIcon, CircleCheckIcon, CircleXIcon, XIcon } from 'icons'
import { Component, JSX, Show, onCleanup, onMount } from 'solid-js'
import './style/alert.scss'

import { createStore, produce } from 'solid-js/store'

type AlertModel = {
    type: 'info' | 'error' | 'success'
    subject: string
    content: string
    timeout: number
    timeleft: number
}

type AlertState = {
    alerts: AlertModel[]
}

export const [alert_state, setAlertState] = createStore<AlertState>({
    alerts: [],
})

export function addAlert(props: Omit<AlertModel, 'timeleft'>) {
    setAlertState(
        produce(s => {
            s.alerts.unshift({ ...props, timeleft: props.timeout * 1e3 })
        })
    )
}

export function delAlert(index: number) {
    setAlertState(
        produce(s => {
            if (index > -1 && index < s.alerts.length) {
                s.alerts.splice(index, 1)
            }
        })
    )
}

const ALERT_ICON: {
    [x in AlertModel['type']]: () => JSX.Element
} = {
    info: () => <CircleAlertIcon />,
    error: () => <CircleXIcon />,
    success: () => <CircleCheckIcon />,
}

const AlertCard: Component<{ a: AlertModel; i: number }> = P => {
    let interval: number
    let timer: HTMLDivElement
    const INTERVAL = 50 // ms

    function do_timeout() {
        setAlertState(
            produce(s => {
                let a = s.alerts[P.i]
                if (!a) return

                a.timeleft -= INTERVAL

                if (a.timeleft < 0) {
                    s.alerts.splice(P.i, 1)
                }
            })
        )
    }

    onMount(() => {
        interval = setInterval(do_timeout, INTERVAL)
    })

    onCleanup(() => clearInterval(interval))

    function pbf_play() {
        interval = setInterval(do_timeout, INTERVAL)
        for (let a of timer.getAnimations()) {
            if (!(a instanceof CSSAnimation && a.animationName == 'pbf'))
                continue

            a.currentTime = P.a.timeout * 1e3 - P.a.timeleft
            a.play()
            break
        }
    }

    function pbf_pause() {
        clearInterval(interval)
        for (let a of timer.getAnimations()) {
            if (!(a instanceof CSSAnimation && a.animationName == 'pbf'))
                continue

            a.pause()
            break
        }
    }

    return (
        <div
            class='alert'
            classList={{ [P.a.type]: true }}
            onMouseEnter={pbf_pause}
            onMouseLeave={pbf_play}
        >
            <div class='head title'>
                {ALERT_ICON[P.a.type]()}
                <span>{P.a.subject}</span>
                <div />
                <button onclick={() => delAlert(P.i)}>
                    <XIcon />
                </button>
            </div>
            <Show when={P.a.content}>
                <div class='body title_smaller'>
                    <p>
                        {P.a.content.split('\n').map(line => (
                            <>
                                {line}
                                <br />
                            </>
                        ))}
                    </p>
                </div>
            </Show>
            <div
                ref={timer}
                class='timer-line'
                style={{
                    'animation-duration': P.a.timeout + 's',
                }}
            ></div>
        </div>
    )
}

export const Alert = () => {
    return (
        <div class='alert-fnd'>
            {alert_state.alerts.map((a, i) => (
                <AlertCard a={a} i={i} />
            ))}
        </div>
    )
}
