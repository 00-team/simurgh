import { Show, render } from 'solid-js/web'

import './style/index.scss'
import { self } from 'store'
import Login from 'layout/login'
import Sidebar from 'layout/sidebar'
import Projects from 'layout/projects'
import NotFound from 'layout/404'
import { Navigate, Route, RouteSectionProps, Router } from '@solidjs/router'
import { Component } from 'solid-js'
import { Alert } from 'comps'

const Dash: Component<RouteSectionProps> = P => {
    return (
        <div class='dash-fnd'>
            <div class='content-fnd'>{P.children}</div>
            <Sidebar />
        </div>
    )
}

const Root = () => {
    return (
        <>
            <Show when={self.loged_in} fallback={<Login />}>
                <Router>
                    <Route path='/' component={Dash}>
                        <Route
                            path='/'
                            component={() => <Navigate href='/projects/' />}
                        />
                        <Route path='/projects/' component={Projects} />
                        <Route path='*' component={NotFound} />
                    </Route>
                </Router>
            </Show>
            <Alert />
        </>
    )
}

render(Root, document.getElementById('root'))
