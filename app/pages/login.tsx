import { createStore } from 'solid-js/store'
import './style/login.scss'
import { check_email, httpx } from '!/shared'

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
                <h1>Login</h1>
                <div class='row email'>
                    <label for='login_email_input'>Email: </label>
                    <input
                        classList={{
                            valid: state.email_status == InputStatus.VALID,
                            error: state.email_status == InputStatus.ERROR,
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
                <div class='row btn'>
                    <button
                        disabled={state.email_status != InputStatus.VALID}
                        onClick={() => {
                            httpx({
                                url: '/api/auth/login/',
                                method: 'GET',
                                type: 'json',
                                params: {
                                    email: state.email,
                                },
                                onLoad(x) {
                                    console.log(x.response)
                                },
                            })
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
