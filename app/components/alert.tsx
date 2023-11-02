import { AlertError, AlertInfo, AlertSuccess } from '!/icon'
import { Component, createSignal, JSX, onCleanup, onMount } from 'solid-js'
import './style/alert.scss'

import { createStore, produce } from 'solid-js/store'

type AlertModel = {
    type: 'info' | 'error' | 'success'
    subject: string
    content: string
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
    [x in AlertModel['type']]: () => JSX.Element
} = {
    info: () => <AlertInfo size={30} />,
    error: () => <AlertError size={30} />,
    success: () => <AlertSuccess size={30} />,
}

const Alert: Component<{ a: AlertModel; i: number }> = props => {
    let interval: number

    const [timeleft, setTimeleft] = createSignal(props.a.timeout)

    function do_timeout() {
        setAlertState(
            produce(s => {
                let a = s.alerts[props.i]
                if (!a) return

                setTimeleft(time => time - 1)
                if (timeleft() < 0) {
                    s.alerts.splice(props.i, 1)
                }

                console.log(timeleft)
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
            classList={{ [props.a.type]: true }}
            onMouseEnter={() => {
                clearInterval(interval)
            }}
            onMouseLeave={() => {
                interval = setInterval(do_timeout, 1000)
            }}
            onClick={() => delAlert(props.i)}
        >
            <div class='head'>
                {ALERT_ICON[props.a.type]()}
                <span>{props.a.subject}</span>
                <div></div>
            </div>
            <div class='body'>
                <p>
                    {props.a.content.split('\n').map(line => (
                        <>
                            {line}
                            <br />
                        </>
                    ))}
                </p>
            </div>
            <span class='timer'>{props.a.timeout}s</span>
            <div
                class='timer-line'
                style={{
                    width: `${100 - (timeleft() / props.a.timeout) * 100}%`,
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
