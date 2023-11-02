import { CodeIcon, UserIcon } from '!/icon'
import { httpx } from '!/shared'
import { createStore, produce } from 'solid-js/store'
import Logo from './logo'
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
            {/* <div class='login'>
                <h1>Simurgh Login</h1>
                <Switch>
                    <Match when={state.stage == 'email'}>
                        <div class='row email'>
                            <label for='login_email_input'>Email: </label>
                            <input
                                classList={{
                                    valid:
                                        state.email_status == InputStatus.VALID,
                                    error:
                                        state.email_status == InputStatus.ERROR,
                                }}
                                id='login_email_input'
                                type='email'
                                placeholder='test@example.com'
                                maxlength={255}
                                onInput={e => {
                                    let v = e.currentTarget.value

                                    if (!v) {
                                        setState({
                                            email_status: InputStatus.UNKNOWN,
                                            email: '',
                                        })
                                        return
                                    }

                                    setState({
                                        email_status: check_email(v)
                                            ? InputStatus.VALID
                                            : InputStatus.ERROR,
                                        email: v,
                                    })
                                }}
                            />
                        </div>
                    </Match>
                    <Match when={state.stage == 'code'}>
                        <div class='row code'>
                            <label for='login_code_input'>Code: </label>
                            <input
                                classList={{
                                    valid:
                                        state.code_status == InputStatus.VALID,
                                    error:
                                        state.code_status == InputStatus.ERROR,
                                }}
                                id='login_code_input'
                                type='text'
                                placeholder='69420'
                                maxlength={5}
                                onInput={e => {
                                    setState({
                                        code: e.currentTarget.value,
                                    })
                                }}
                            />
                        </div>
                    </Match>
                </Switch>

                <div class='row btn'>
                    <button
                        disabled={
                            state.stage == 'email'
                                ? state.email_status != InputStatus.VALID
                                : state.code.length != 5
                        }
                        onClick={() => {
                            if (state.stage == 'email') {
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
                                                email_status: InputStatus.ERROR,
                                            })
                                        }
                                    },
                                })
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
                            }
                        }}
                        onMouseEnter={e => {
                            const el = e.currentTarget
                            const { left, width } = el.getBoundingClientRect()

                            const bx = left + width

                            if (e.clientX - left < bx - e.clientX) {
                                el.style.setProperty('--left', '0')
                                el.style.setProperty('--right', 'unset')
                            } else {
                                el.style.setProperty('--left', 'unset')
                                el.style.setProperty('--right', '0')
                            }
                        }}
                    >
                        Send Code
                    </button>
                </div>
            </div> */}
            <div class='login-wrapper'>
                <aside class='logo-img'>
                    <Logo />
                    {/*
                    <img src='/static/image/logo.new.svg' />
                    <object
                        data='/static/image/logo.svg'
                        type='image/svg+xml'
                    ></object>*/}
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
