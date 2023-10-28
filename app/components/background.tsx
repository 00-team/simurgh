import { onCleanup, onMount } from 'solid-js'
import './style/background.scss'
import { createStore } from 'solid-js/store'

export default () => {
    const [state, setState] = createStore({
        w: innerWidth,
        h: innerHeight,
    })

    function update_on_resize() {
        setState({ w: innerWidth, h: innerHeight })
    }

    onMount(() => {
        window.addEventListener('resize', update_on_resize)
    })

    onCleanup(() => {
        window.removeEventListener('resize', update_on_resize)
    })

    // <path d='M12 4.5v15m7.5-7.5h-15'>

    return (
        <div class='main-background'>
            <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox={`0 0 320 320`}
                stroke-width='1'
                stroke='#aaa'
                style={{ border: '2px solid red' }}
            >
                {Array.from(Array(10)).map((_, y) => (
                    <>
                        {Array.from(Array(10)).map((_, x) => (
                            <g
                                transform={`translate(${x * 32 + 8} ${
                                    y * 32 + 8
                                })`}
                            >
                                <path
                                    d={`M8 0v16m8-8h-16`}
                                    transform-origin='8 8'
                                >
                                    <animateTransform
                                        attributeName='transform'
                                        attributeType='XML'
                                        type='scale'
                                        values={`1;0;1`}
                                        dur='4s'
                                        begin={~~(Math.random() * 6) + 's'}
                                        repeatCount='indefinite'
                                    />
                                </path>
                            </g>
                        ))}
                    </>
                ))}
                {/*
                <path d='M0 0v16m8-8h-16'>
                    <animateTransform
                        attributeName='transform'
                        attributeType='XML'
                        type='scale'
                        values='0;1;0'
                        dur='3s'
                        repeatCount='indefinite'
                    />
                </path>
*/}
            </svg>
        </div>
    )
}
