import { createStore } from 'solid-js/store'
import './style/login.scss'
import { check_email, httpx } from '!/shared'
import { Match, Switch } from 'solid-js'

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

    return (
        <div class='login-fnd'>
            <div class='login'>
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
            </div>
        </div>
    )
}
