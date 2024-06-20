import { Show, render } from 'solid-js/web'
import { Component, lazy } from 'solid-js'
import { Navigate, Route, RouteSectionProps, Router } from '@solidjs/router'

import { Alert } from 'comps'
import { self } from 'store'

import Login from 'layout/login'
import Sidebar from 'layout/sidebar'
import Projects from 'layout/projects'
import NotFound from 'layout/404'
const Project = lazy(() => import('layout/project'))
const Records = lazy(() => import('layout/records'))
const Blog = lazy(() => import('layout/blog'))
const Blogs = lazy(() => import('layout/blogs'))
const Editor = lazy(() => import('layout/editor'))

import './style/index.scss'

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
                        <Route path='/projects/:pid'>
                            <Route path='/' component={Project} />
                            <Route path='/records/' component={Records} />
                            <Route path='/blogs' component={Blogs} />
                            <Route path='/blogs/:bid'>
                                <Route path='/' component={Blog} />
                                <Route path='/editor/' component={Editor} />
                            </Route>
                        </Route>
                        <Route path='*' component={NotFound} />
                    </Route>
                </Router>
            </Show>
            <Alert />
        </>
    )
}

render(Root, document.getElementById('root'))
