import { Show, render } from 'solid-js/web'

import './style/index.scss'
import { self } from 'store'
import Login from 'layout/login'
import Sidebar from 'layout/sidebar'

const Root = () => {
    return (
        <Show when={self.loged_in} fallback={<Login />}>
            app
            <Sidebar />
        </Show>
    )
}

render(Root, document.getElementById('root'))
