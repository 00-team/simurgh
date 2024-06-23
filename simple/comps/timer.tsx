import { Component, createSignal, onMount } from 'solid-js'

type Props = {
    seconds: number
}
export const Timer: Component<Props> = P => {
    const [seconds, setSeconds] = createSignal(P.seconds)
    let timer: number

    onMount(() => {
        timer = setInterval(() => {
            setSeconds(s => {
                if (s < 2) {
                    clearInterval(timer)
                    return 0
                }
                return s - 1
            })
        }, 1e3)
    })

    return <span class='cmp-timer'>{seconds()} ثانیه باقی مانده</span>
}
