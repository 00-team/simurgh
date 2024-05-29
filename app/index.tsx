import { Show, render } from 'solid-js/web'

import './style/index.scss'
import { self } from 'store'
import Login from 'layout/login'
import Sidebar from 'layout/sidebar'

const Root = () => {
    return (
        <Show when={self.loged_in} fallback={<Login />}>
            <div class='dash-fnd'>
                <div class='content-fnd'>
                    <div class='content-wrapper'></div>
                </div>
                <Sidebar />
            </div>
        </Show>
    )
}

render(Root, document.getElementById('root'))
