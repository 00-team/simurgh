import { Component, createSignal, onCleanup, onMount } from 'solid-js'

interface HackEffectProps {
    sentence: string
    delay?: number

    onfinish?: () => void | void
}

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const HackEffect: Component<HackEffectProps> = ({
    sentence,
    delay,
    onfinish,
}) => {
    const [Text, setText] = createSignal(sentence)

    let iteration = 0

    let interval

    onMount(() => {
        if (delay) {
            interval = setInterval(() => {
                setText(text => {
                    let newText = text
                        .split('')
                        .map((_, index) => {
                            if (index < iteration) {
                                return sentence[index]
                            }

                            return letters[
                                Math.floor(Math.random() * letters.length)
                            ]
                        })
                        .join('')

                    return newText
                })

                setTimeout(() => {
                    if (iteration >= sentence.length) {
                        onfinish()
                        clearInterval(interval)
                    }

                    iteration += 1 / 3
                }, delay)
            }, 30)
        } else {
            interval = setInterval(() => {
                setText(text => {
                    let newText = text
                        .split('')
                        .map((_, index) => {
                            if (index < iteration) {
                                return sentence[index]
                            }

                            return letters[
                                Math.floor(Math.random() * letters.length)
                            ]
                        })
                        .join('')

                    return newText
                })

                if (iteration >= sentence.length) {
                    onfinish()
                    clearInterval(interval)
                }

                iteration += 1 / 3
            }, 30)
        }
    })
    onCleanup(() => {
        clearInterval(interval)
    })
    return <span class='effect-word'>{Text()}</span>
}
