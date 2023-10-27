import { Component, createSignal, onCleanup } from 'solid-js'

import './style/test.scss'

export const Test: Component = props => {
    const [percent, setPercent] = createSignal(0)

    const interval = setInterval(() => {
        if (percent() < 100) {
            setPercent(prev => prev + 1)
        } else {
            clearInterval(interval)
        }
    }, 75)

    onCleanup(() => {
        clearInterval(interval)
    })

    return (
        <div class='test-container'>
            <div class='loader'>
                <div class='line'></div>
                <span>{percent()}%</span>
            </div>
        </div>
    )
}
