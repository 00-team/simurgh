import { Timer } from 'comps'
import { CodeIcon, Logo, PhoneIcon } from 'icons'
import { Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { setSelf } from 'store'
import './style/login.scss'

import * as a from 'abi'

export default () => {
    type State = {
        stage: 'phone' | 'code'
        phone: string
        code: string
        loading: boolean
        expires: number
    }
    const [state, setState] = createStore<State>({
        stage: 'phone',
        phone: '',
        code: '',
        loading: false,
        expires: 0,
    })

    async function verification() {
        if (state.phone.length != 11) return
        if (!state.phone.startsWith('09')) return

        setState({ loading: true })

        let r = await a.api_verification_post({
            phone: state.phone,
            action: 'login',
        })
        if (r.err()) return

        setState({ loading: false })

        setState({
            stage: 'code',
            expires: r.body.next_resend || r.body.verify_expires,
        })
    }

    async function user_login() {
        if (state.code.length != 5) return

        setState({ loading: true })

        let r = await a.api_user_login_post({
            phone: state.phone,
            code: state.code,
        })
        if (r.err()) return

        setState({ loading: false })

        setSelf({
            loged_in: true,
            fetch: false,
            user: r.body.user,
        })
    }

    return (
        <div class='login-fnd'>
            <div class='login-card'>
                <form
                    action={''}
                    onsubmit={async e => {
                        e.preventDefault()

                        if (state.stage == 'phone') return await verification()
                        await user_login()
                    }}
                    class='login-form title_small'
                    classList={{ loading: state.loading }}
                >
                    <div class='inputs'>
                        <div class='input'>
                            <label
                                for='login-phone'
                                classList={{ disabled: state.stage != 'phone' }}
                            >
                                <PhoneIcon />
                                شماره:
                            </label>
                            <input
                                disabled={state.stage != 'phone'}
                                id='login-phone'
                                type='phone'
                                class='title_small'
                                placeholder='09120004444'
                                value={state.phone}
                                onInput={e =>
                                    setState({ phone: e.currentTarget.value })
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
                            when={state.stage == 'phone'}
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
