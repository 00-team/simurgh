import { A } from '@solidjs/router'
import './style/404.scss'

export default () => {
    return (
        <div class='not-found-fnd'>
            <h1>صفحه مورد نظر شما پیدا نشد!</h1>
            <A href='/'>خانه</A>
        </div>
    )
}
