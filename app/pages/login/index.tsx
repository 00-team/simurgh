import Logo from '!/components/logo'
import { CodeIcon, UserIcon } from '!/icon'
import { httpx } from '!/shared'
import { createStore, produce } from 'solid-js/store'

import './style/login.scss'

enum InputStatus {
    UNKNOWN,
    ERROR,
    VALID,
}

type State = {
    stage: 'email' | 'code'
    email: string
    code: string
    email_status: InputStatus
    code_status: InputStatus
    error_message: string
}

export default () => {
    const [state, setState] = createStore<State>({
        stage: 'email',
        email: '',
        code: '',
        email_status: InputStatus.UNKNOWN,
        code_status: InputStatus.UNKNOWN,
        error_message: '',
    })

    const validate_gmail = (): boolean => {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

        return emailRegex.test(state.email)
    }

    return (
        <div class='login-fnd'>
            <div class='login-wrapper'>
                <aside class='logo-img'>
                    <Logo />
                </aside>
                <aside class='detail'>
                    <header class='section_title eng'>Login</header>
                    <form
                        onsubmit={e => {
                            e.preventDefault()

                            if (state.stage === 'email') {
                                if (validate_gmail()) {
                                    httpx({
                                        url: '/api/verification/',
                                        method: 'POST',
                                        type: 'json',
                                        json: {
                                            email: state.email,
                                            action: 'login',
                                        },
                                        onLoad(x) {
                                            if (x.status == 200) {
                                                setState({
                                                    code: '',
                                                    stage: 'code',
                                                })
                                            } else {
                                                setState({
                                                    email_status:
                                                        InputStatus.ERROR,
                                                })
                                            }
                                        },
                                    })
                                    setState(
                                        produce(s => {
                                            s.stage = 'code'
                                            s.email_status = InputStatus.VALID
                                        })
                                    )

                                    return
                                } else {
                                    httpx({
                                        url: '/api/auth/login/',
                                        method: 'POST',
                                        type: 'json',
                                        json: {
                                            email: state.email,
                                            code: state.code,
                                        },
                                        onLoad(x) {
                                            if (x.status == 200) {
                                                setState({
                                                    code: 'cool',
                                                    stage: 'code',
                                                })
                                            } else {
                                                setState({
                                                    code_status:
                                                        InputStatus.ERROR,
                                                })
                                            }
                                        },
                                    })

                                    setState(
                                        produce(s => {
                                            s.email_status = InputStatus.ERROR
                                            s.error_message =
                                                'نام کاربری وارد شده نادرست است!'
                                        })
                                    )

                                    return
                                }
                            } else {
                                httpx({
                                    url: '/api/auth/login/',
                                    method: 'POST',
                                    type: 'json',
                                    json: {
                                        email: state.email,
                                        code: state.code,
                                    },
                                    onLoad(x) {
                                        if (x.status == 200) {
                                            setState({
                                                code: 'cool',
                                                stage: 'code',
                                            })
                                        } else {
                                            setState({
                                                code_status: InputStatus.ERROR,
                                            })
                                        }
                                    },
                                })
                                return
                            }
                        }}
                        class='inps'
                    >
                        <div
                            class='inp rtl gmail'
                            classList={{
                                holder: state.email.length >= 1,
                                active: state.stage === 'email',
                            }}
                        >
                            <span class='title_small'>
                                <div class='icon'>
                                    <UserIcon />
                                </div>
                                <div class='holder'>نام کاربری</div>
                            </span>
                            <input
                                type='text'
                                class='title_small'
                                name='userEmail'
                                onchange={e => {
                                    setState(
                                        produce(s => {
                                            s.email = e.target.value
                                        })
                                    )
                                }}
                            />
                        </div>
                        <div
                            class='inp rtl code'
                            classList={{
                                holder: state.code.length >= 1,
                                active: state.stage === 'code',
                            }}
                        >
                            <span class='title_small'>
                                <div class='icon'>
                                    <CodeIcon />
                                </div>
                                <div class='holder'>کد ارسالی </div>
                            </span>
                            <input
                                type='text'
                                class='title_small'
                                onchange={e => {
                                    setState(
                                        produce(s => {
                                            s.code = e.target.value
                                        })
                                    )
                                }}
                            />
                        </div>
                        <button class='title_small basic-button' type='submit'>
                            <span
                                class='gmail'
                                classList={{ active: state.stage === 'email' }}
                            >
                                ارسال کد
                            </span>
                            <span
                                classList={{ active: state.stage === 'code' }}
                                class='code'
                            >
                                تایید کد
                            </span>
                        </button>
                    </form>
                </aside>
            </div>
        </div>
    )
}
