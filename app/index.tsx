import { Show, render } from 'solid-js/web'

import './style/index.scss'
import { self } from 'store'
import Login from 'layout/login'
import Sidebar from 'layout/sidebar'
import NotFound from 'layout/404'
import { Route, RouteSectionProps, Router } from '@solidjs/router'
import { Component } from 'solid-js'

const Dash: Component<RouteSectionProps> = P => {
    return (
        <div class='dash-fnd'>
            <div class='content-fnd'>
                <div class='content-wrapper'>{P.children}</div>
            </div>
            <Sidebar />
        </div>
    )
}

const Root = () => {
    return (
        <Show when={self.loged_in} fallback={<Login />}>
            <Router>
                <Route path='/' component={Dash}>
                    <Route path='/' component={() => <span>Gi</span>} />
                    <Route path='*' component={NotFound} />
                </Route>
            </Router>
        </Show>
    )
}

render(Root, document.getElementById('root'))
