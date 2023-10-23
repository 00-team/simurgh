import { AlertError, AlertInfo, AlertSuccess, CloseIcon } from '!/icon'
import { Component, JSX, onCleanup, onMount } from 'solid-js'
import './style/alert.scss'

import { createStore, produce } from 'solid-js/store'

type AlertModel = {
    level: 'info' | 'error' | 'success'
    title: string
    detail: string
    timeout: number
}

type AlertState = {
    alerts: AlertModel[]
}

const [alert_state, setAlertState] = createStore<AlertState>({
    alerts: [],
})

function addAlert(props: AlertModel) {
    setAlertState(
        produce(s => {
            s.alerts.unshift(props)
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
    [x in AlertModel['level']]: () => JSX.Element
} = {
    info: () => <AlertInfo />,
    error: () => <AlertError />,
    success: () => <AlertSuccess />,
}

const Alert: Component<{ a: AlertModel; i: number }> = props => {
    let interval: number

    function do_timeout() {
        setAlertState(
            produce(s => {
                let a = s.alerts[props.i]
                if (!a) return

                a.timeout -= 1
                if (a.timeout < 0) {
                    s.alerts.splice(props.i, 1)
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
            classList={{ [props.a.level]: true }}
            onMouseEnter={() => {
                clearInterval(interval)
            }}
            onMouseLeave={() => {
                interval = setInterval(do_timeout, 1000)
            }}
        >
            <div class='head'>
                {ALERT_ICON[props.a.level]()}
                <span>{props.a.title}</span>
                <button onClick={() => delAlert(props.i)}>
                    <CloseIcon />
                </button>
            </div>
            <div class='body'>
                <p>
                    {props.a.detail.split('\n').map(line => (
                        <>
                            {line}
                            <br />
                        </>
                    ))}
                </p>
            </div>
            <span class='timer'>{props.a.timeout}s</span>
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
