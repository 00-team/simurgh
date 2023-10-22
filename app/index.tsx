/* @refresh reload */

import { Route, Router, Routes } from '@solidjs/router'
import { render } from 'solid-js/web'

import 'solid-devtools'

import './style/base.scss'
import './style/buttons.scss'
import './style/config.scss'
import './style/font/imports.scss'
import './style/theme.scss'

import { lazy } from 'solid-js'
import { UserData } from './stores'

render(
    () => (
        <Router>
            <Routes>
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
            </Routes>
        </Router>
    ),
    document.getElementById('root')
)
