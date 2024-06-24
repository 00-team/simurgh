import { ChevronDownIcon, ChevronUpIcon } from 'icons'
import './style/select.scss'
import { createStore, produce } from 'solid-js/store'
import { Show, createEffect, on } from 'solid-js'

type BaseItem = { display: string; idx: number }

type Props<T extends BaseItem[]> = {
    items: T
    onChange(props: T): void
    defaults?: T
    multiple?: true | number
    disabled?: boolean
}

export const Select = <T extends BaseItem[]>(P: Props<T>) => {
    type State = {
        open: boolean
        selected: typeof P.items
        changed: number
    }
    const [state, setState] = createStore<State>({
        open: false,
        selected: P.defaults || ([] as T),
        changed: 0,
    })

    createEffect(
        on(
            () => state.changed,
            () => P.onChange(state.selected),
            { defer: true }
        )
    )

    createEffect(() => {
        if (P.disabled) setState({ open: false })
    })

    return (
        <div class='cmp-select' classList={{ disabled: P.disabled }}>
            <div
                class='cmp-select-head'
                onclick={() =>
                    !P.disabled && setState(s => ({ open: !s.open }))
                }
            >
                <Show
                    when={P.multiple}
                    fallback={<>{state.selected[0]?.display || '---'}</>}
                >
                    <div class='selected'>
                        {state.selected.map(item => (
                            <div class='item'>{item.display}</div>
                        ))}
                        {!state.selected.length && '---'}
                    </div>
                </Show>
                <Show when={!P.disabled}>
                    {state.open ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </Show>
            </div>
            <div
                class='cmp-select-body'
                classList={{ active: state.open, multiple: !!P.multiple }}
            >
                {P.items.map(item => (
                    <div
                        class='item'
                        classList={{
                            active: !!state.selected.find(
                                i => i.idx == item.idx
                            ),
                        }}
                        onclick={() =>
                            setState(
                                produce(s => {
                                    if (!P.multiple) {
                                        s.selected = [item] as T
                                        s.changed = performance.now()
                                        return
                                    }

                                    let x = s.selected.findIndex(
                                        i => i.idx == item.idx
                                    )

                                    if (x != -1) {
                                        s.selected.splice(x, 1)
                                    } else {
                                        if (
                                            typeof P.multiple == 'number' &&
                                            s.selected.length >= P.multiple
                                        )
                                            return

                                        s.selected.push(item)
                                    }

                                    s.changed = performance.now()
                                })
                            )
                        }
                    >
                        {item.display}
                    </div>
                ))}
            </div>
        </div>
    )
}
