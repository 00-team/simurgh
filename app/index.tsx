/* @refresh reload */

import { Route, Router, Routes } from '@solidjs/router'
import { Show, render } from 'solid-js/web'

import 'solid-devtools'

import './style/base.scss'
import { user } from './stores'
import { lazy } from 'solid-js'

// import { lazy } from 'solid-js'
// import { UserData } from './stores'

const Login = lazy(() => import('./pages/login'))
const Alert = lazy(() => import('./components/alert'))

function Main() {
    return (
        <Show fallback={<Login />} when={user.user_id}>
            <span>user id: {user.user_id}</span>
        </Show>
    )
}

render(
    () => (
        <>
            <Router>
                <Routes>
                    <Route path='/' component={Main} />
                    {/*
                <Route

                    path='/dash/'
                    component={lazy(() => import('./dash'))}
                    data={UserData}
                />
                <Route
                    path='/admin'
                    component={lazy(() => import('./admin'))}
                    data={UserData}
                >
                    <Route
                        path='/'
                        component={lazy(() => import('./admin/general'))}
                    />
                    <Route
                        path='/users/'
                        component={lazy(() => import('./admin/users'))}
                    />
                    <Route
                        path='/projects/'
                        component={lazy(() => import('./admin/projects'))}
                    />
                    <Route
                        path='/projects/:id/'
                        component={lazy(() => import('./admin/project'))}
                    />
                </Route>*/}
                </Routes>
            </Router>
            <Alert />
        </>
    ),
    document.getElementById('root')
)
