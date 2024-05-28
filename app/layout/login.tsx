import { Logo } from 'icons'
import './style/login.scss'

export default () => {
    return (
        <div class='login-fnd'>
            <div class='login-card'>
                <div class='logo'>
                    <Logo />
                </div>
                <div class='login-form'>
                    <div class='row'>
                        <label for='login-email'>ایمیل:</label>
                        <input id='login-email' type='email' class='styled' />
                    </div>
                    <div class='row'>pin</div>
                    <button class='styled'>action</button>
                </div>
            </div>
        </div>
    )
}
