import { CircleAlertIcon, CircleCheckIcon, CircleXIcon, XIcon } from 'icons'
import { Component, JSX, onCleanup, onMount } from 'solid-js'
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

const [alert_state, setAlertState] = createStore<AlertState>({
    alerts: [],
})

function addAlert(props: Omit<AlertModel, 'timeleft'>) {
    setAlertState(
        produce(s => {
            s.alerts.unshift({ ...props, timeleft: props.timeout })
        })
    )
}

function delAlert(index: number) {
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

const Alert: Component<{ a: AlertModel; i: number }> = P => {
    let interval: number
    let timer: HTMLDivElement

    function do_timeout() {
        setAlertState(
            produce(s => {
                let a = s.alerts[P.i]
                if (!a) return

                a.timeleft -= 1

                if (a.timeleft < 0) {
                    s.alerts.splice(P.i, 1)
                }
            })
        )
    }

    onMount(() => {
        interval = setInterval(do_timeout, 1000)
    })

    onCleanup(() => clearInterval(interval))

    return (
        <div
            class='alert'
            classList={{ [P.a.type]: true }}
            onMouseEnter={() => {
                clearInterval(interval)
                let a = timer.getAnimations()[0]
                if (a) a.pause()
            }}
            onMouseLeave={() => {
                interval = setInterval(do_timeout, 1000)
                let a = timer.getAnimations()[0]
                if (a) {
                    a.currentTime = (P.a.timeout - P.a.timeleft - 1) * 1000
                    a.play()
                }
            }}
        >
            <div class='head'>
                {ALERT_ICON[P.a.type]()}
                <span>{P.a.subject}</span>
                <div />
                <button onclick={() => delAlert(P.i)}>
                    <XIcon />
                </button>
            </div>
            <div class='body'>
                <p>
                    {P.a.content.split('\n').map(line => (
                        <>
                            {line}
                            <br />
                        </>
                    ))}
                </p>
            </div>
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

export default () => {
    return (
        <div class='alert-fnd'>
            {alert_state.alerts.map((a, i) => (
                <Alert a={a} i={i} />
            ))}
        </div>
    )
}

export { alert_state, setAlertState, addAlert, delAlert }
