import { Logo } from 'icons'
import './style/login.scss'
import { createStore } from 'solid-js/store'
import { httpx } from 'shared'
import { Show } from 'solid-js'
import { setSelf } from 'store'

export default () => {
    type State = {
        stage: 'email' | 'code'
        email: string
        code: string
        loading: boolean
    }
    const [state, setState] = createStore<State>({
        stage: 'email',
        email: '',
        code: '',
        loading: false,
    })

    function verification() {
        if (state.email.length < 3) return
        if (!state.email.includes('@')) return

        setState({ loading: true })

        httpx({
            url: '/api/verification/',
            method: 'POST',
            json: {
                action: 'login',
                email: state.email,
            },
            onLoad(x) {
                setState({ loading: false })
                if (x.status == 200 && x.response.expires > 0) {
                    setState({ stage: 'code' })
                }
            },
        })
    }

    function user_login() {
        if (state.code.length != 5) return

        setState({ loading: true })

        httpx({
            url: '/api/user/login/',
            method: 'POST',
            json: {
                email: state.email,
                code: state.code,
            },
            onLoad(x) {
                setState({ loading: false })
                if (x.status == 200) {
                    setSelf({
                        loged_in: true,
                        fetch: false,
                        user: x.response,
                    })
                }
            },
        })
    }

    return (
        <div class='login-fnd'>
            <div class='login-card'>
                <div class='logo'>
                    <Logo />
                </div>
                <div class='login-form' classList={{ loading: state.loading }}>
                    <div class='grid'>
                        <label
                            for='login-email'
                            classList={{ disabled: state.stage != 'email' }}
                        >
                            ایمیل:
                        </label>
                        <input
                            disabled={state.stage != 'email'}
                            id='login-email'
                            type='email'
                            class='styled'
                            placeholder='simurgh@example.com'
                            value={state.email}
                            onInput={e =>
                                setState({ email: e.currentTarget.value })
                            }
                        />
                        <label
                            classList={{ disabled: state.stage != 'code' }}
                            for='login-code'
                        >
                            کد:
                        </label>
                        <input
                            disabled={state.stage != 'code'}
                            id='login-code'
                            maxLength={5}
                            pattern='\d{5,5}'
                            class='styled'
                            placeholder='12345'
                            value={state.code}
                            onInput={e =>
                                setState({ code: e.currentTarget.value })
                            }
                        />
                    </div>
                    <Show
                        when={state.stage == 'email'}
                        fallback={
                            <button class='styled' onclick={user_login}>
                                تایید کد
                            </button>
                        }
                    >
                        <button class='styled' onclick={verification}>
                            دریافت کد
                        </button>
                    </Show>
                </div>
            </div>
        </div>
    )
}
