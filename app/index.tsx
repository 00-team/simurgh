/* @refresh reload */

import { Route, Router, Routes } from '@solidjs/router'
import { render, Show } from 'solid-js/web'

import 'solid-devtools'

import { lazy } from 'solid-js'
import { user } from './stores'
import './style/base.scss'
import './style/buttons.scss'
import './style/config.scss'
import './style/theme.scss'
import '/static/fonts/fonts.css'
import Projects from './pages/dashboard/projects'

// import { lazy } from 'solid-js'
// import { UserData } from './stores'

const Login = lazy(() => import('./pages/login'))
const Alert = lazy(() => import('./components/alert'))
const Progress = lazy(() => import('./components/progress'))
const Dashboard = lazy(() => import('./pages/dashboard'))
const BlogEditor = lazy(() => import('./pages/blog-editor'))
// const Background = lazy(() => import('./components/background'))

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
                    <Route path='/blog-editor' component={BlogEditor} />

                    <Route path={'/dashboard'} component={Dashboard}>
                        <Route path={'projects'} component={Projects} />
                    </Route>

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
                </Route>

*/}
                </Routes>
            </Router>
            <Alert />
            <Progress />
        </>
    ),
    document.getElementById('root')
)
