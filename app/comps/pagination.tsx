import { Component, Show, createEffect } from 'solid-js'

import './style/pagination.scss'
import { ChevronLeftIcon, ChevronRightIcon } from 'icons'
import { createStore, produce } from 'solid-js/store'

type Props = {
    total: number
    current?: number
    onChange?: (page: number) => void
}

type State = {
    total: number
    current: number
    pages: number[]
}

export const Pagination: Component<Props> = P => {
    const [state, setState] = createStore<State>({
        total: P.total,
        current: P.current || 0,
        pages: [],
    })

    createEffect(() => {
        if (!P.onChange) return
        P.onChange(state.current)
    })

    createEffect(() => {
        state.total
        state.current

        setState(
            produce(s => {
                const K = 3
                s.pages = []

                if (s.total <= K + 2) {
                    for (let i = 0; i < s.total; ++i) {
                        s.pages.push(i)
                    }
                    return
                }

                if (s.current > K && s.current + K < s.total) {
                    s.pages = [0]
                    let i = s.current - (K - 1)
                    if (i - 1 != 0) s.pages.push(-1)
                    for (; i <= s.current + (K - 1); ++i) {
                        s.pages.push(i)
                    }
                    s.pages.push(-1, s.total)
                    return
                }

                if (s.current <= K) {
                    s.pages = []
                    for (let i = 0; i <= K + 2; ++i) {
                        s.pages.push(i)
                    }
                    if (s.pages.at(-1) + 1 != s.total) s.pages.push(-1)
                    s.pages.push(s.total)
                    return
                }

                if (s.current + K >= s.total) {
                    s.pages = [0]
                    if (s.total - (K + 2) != 1) s.pages.push(-1)
                    for (let i = s.total - (K + 2); i <= s.total; ++i) {
                        s.pages.push(i)
                    }
                    return
                }
            })
        )
    })

    createEffect(() => {
        if (state.total < 0) {
            setState({ total: 0 })
            return
        }

        if (state.current < 0) {
            setState({ current: 0 })
            return
        }

        if (state.current > state.total) {
            setState({ current: state.total })
            return
        }
    })

    return (
        <div class='cmp-pagination'>
            <button
                disabled={state.current <= 0}
                onclick={() => setState(s => ({ current: s.current - 1 }))}
            >
                <ChevronLeftIcon />
            </button>

            {state.pages.map(i => (
                <Show when={i >= 0} fallback={<span>&#8230;</span>}>
                    <button
                        disabled={state.current == i}
                        onclick={() => setState({ current: i })}
                        title={i.toLocaleString()}
                    >
                        {i.toLocaleString()}
                    </button>
                </Show>
            ))}

            <button
                disabled={state.current + 1 >= state.total}
                onclick={() => setState(s => ({ current: s.current + 1 }))}
            >
                <ChevronRightIcon />
            </button>
        </div>
    )
}
