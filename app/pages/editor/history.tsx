import { createStore } from 'solid-js/store'
import './style/history.scss'
import { ChevronLeft, ChevronRight, Redo, Trash, Undo } from '!/icons/editor'

type State = {
    collapsed: boolean
    trashing: boolean
}

export default () => {
    const [state, setState] = createStore<State>({
        collapsed: false,
        trashing: false,
    })

    return (
        <div class='leftside' classList={{ collapsed: state.collapsed }}>
            <button
                class='collapse-btn'
                onclick={() => setState(s => ({ collapsed: !s.collapsed }))}
            >
                {state.collapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>

            <div class='inner'>
                <div class='actions'>
                    <button style={{ 'border-right-width': '2px' }}>
                        <Undo />
                    </button>
                    <button
                        class='trash'
                        classList={{ active: state.trashing }}
                        oncontextmenu={e => {
                            e.preventDefault()
                            if (state.trashing) {
                                setState({ trashing: false })
                            }
                        }}
                        onclick={() =>
                            setState(s => {
                                if (s.trashing) {
                                    alert('history has been cleared!')
                                    return { trashing: false }
                                } else {
                                    setTimeout(() => {
                                        setState(s => {
                                            if (s.trashing) {
                                                return { trashing: false }
                                            }
                                            return null
                                        })
                                    }, 3000)

                                    return { trashing: true }
                                }
                            })
                        }
                    >
                        <Trash />
                    </button>
                    <button style={{ 'border-left-width': '2px' }} disabled>
                        <Redo />
                    </button>
                </div>
                <div class='list'></div>
            </div>
        </div>
    )
}
