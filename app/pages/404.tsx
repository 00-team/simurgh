import { A } from '@solidjs/router'
import './style/404.scss'

export default () => {
    return (
        <div class='not-found-fnd'>
            <h1 class='section_title'>صفحه مورد نظر شما پیدا نشد!</h1>
            <A href='/' class='title'>
                خانه
            </A>
        </div>
    )
}
