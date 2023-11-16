import { Component, createSignal, onCleanup, onMount } from 'solid-js'

import './style/typing.scss'

interface TypingProps {
    sentence: string
    speed: number
    classList?: string
    delay?: number
}

export const Typing: Component<TypingProps> = ({
    sentence,
    speed,
    classList = '',
    delay,
}) => {
    const [text, setText] = createSignal('')

    let cursor: HTMLElement

    onMount(() => {
        cursor = document.querySelector('div.typer-cursor') as HTMLElement
    })

    let index = 0
    let timer

    function type() {
        setText(sentence.slice(0, index))
        index++

        if (index <= sentence.length) {
            timer = setTimeout(type, speed)
        } else {
            console.log('slm')
            cursor.style.animationIterationCount = `1`
            console.log(cursor.style.animation)
        }
    }

    onCleanup(() => clearTimeout(timer))

    if (delay) {
        setTimeout(() => {
            type()
        }, delay)
    } else {
        type()
    }

    return (
        <div class={`typer ${classList}`}>
            <span class='typer-word'>{text()}</span>
            <div class='typer-cursor'></div>
        </div>
    )
}
