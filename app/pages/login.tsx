import { Timer } from 'comps'
import { CodeIcon, EmailIcon, Logo } from 'icons'
import { httpx } from 'shared'
import { Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { setSelf } from 'store'
import './style/login.scss'

export default () => {
    type State = {
        stage: 'email' | 'code'
        email: string
        code: string
        loading: boolean
        expires: number
    }
    const [state, setState] = createStore<State>({
        stage: 'email',
        email: '',
        code: '',
        loading: false,
        expires: 0,
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
                    setState({ stage: 'code', expires: x.response.expires })
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
                <form
                    action={''}
                    onsubmit={e => {
                        e.preventDefault()

                        if (state.stage == 'email') return verification()
                        user_login()
                    }}
                    class='login-form title_small'
                    classList={{ loading: state.loading }}
                >
                    <div class='inputs'>
                        <div class='input'>
                            <label
                                for='login-email'
                                classList={{ disabled: state.stage != 'email' }}
                            >
                                <EmailIcon />
                                ایمیل:
                            </label>
                            <input
                                disabled={state.stage != 'email'}
                                id='login-email'
                                type='email'
                                class='title_small'
                                placeholder='simurgh@example.com'
                                value={state.email}
                                onInput={e =>
                                    setState({ email: e.currentTarget.value })
                                }
                            />
                        </div>

                        <div class='input code'>
                            <label
                                classList={{ disabled: state.stage != 'code' }}
                                for='login-code'
                            >
                                <CodeIcon />
                                کد:
                            </label>
                            <input
                                id='login-code'
                                class='styled title_small'
                                disabled={state.stage != 'code'}
                                maxLength={5}
                                inputMode={'numeric'}
                                pattern='\d{5,5}'
                                placeholder='12345'
                                value={state.code}
                                onInput={e =>
                                    setState({ code: e.currentTarget.value })
                                }
                            />
                        </div>
                    </div>

                    <Show when={state.stage == 'code'}>
                        <Timer seconds={state.expires} />
                    </Show>
                    <button class='cta title_smaller' type='submit'>
                        <Show
                            when={state.stage == 'email'}
                            fallback={<>تایید کد</>}
                        >
                            دریافت کد
                        </Show>
                    </button>
                </form>
                <div class='logo'>
                    <Logo />
                </div>
            </div>
        </div>
    )
}
