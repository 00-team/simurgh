import { Route, Router } from '@solidjs/router'
import { render } from 'solid-js/web'

import { lazy, Show } from 'solid-js'
import { Project } from './pages/dashboard/project'
import { Projects } from './pages/dashboard/projects'
import { user, UserData } from './stores'
import './style/base.scss'
import './style/buttons.scss'
import './style/config.scss'
import './style/theme.scss'
import '/static/fonts/fonts.css'

// import { lazy } from 'solid-js'
// import { UserData } from './stores'

const Login = lazy(() => import('./pages/login'))
const Alert = lazy(() => import('./components/alert'))
const Progress = lazy(() => import('./components/progress'))
const Dashboard = lazy(() => import('./pages/dashboard'))
const Editor = lazy(() => import('./pages/editor'))
// const Background = lazy(() => import('./components/background'))

function Main() {
    return (
        <Show fallback={<Login />} when={user.user_id || true}>
            <Route path='/' component={Dashboard}>
                <Route path={'projects'} component={Projects} />
                <Route path={'project/:id'} component={Project} />
                <Route path={'*'} component={() => <></>} />
            </Route>
        </Show>
    )
}

render(
    () => (
        <>
            <Router>
                <Route path='/editor' component={Editor} />

                <Main />
            </Router>
            <Alert />
            <Progress />
        </>
    ),
    document.getElementById('root')
)
