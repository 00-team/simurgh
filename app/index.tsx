import { Navigate, Route, Router, RouteSectionProps } from '@solidjs/router'
import { Component, createEffect, lazy, onMount } from 'solid-js'
import { render, Show } from 'solid-js/web'

import { Alert } from 'comps'
import { self, setTheme, theme } from 'store'

import Sidebar from 'layout/sidebar'
import NotFound from 'pages/404'
import Login from 'pages/login'
import Projects from 'pages/projects'
const Project = lazy(() => import('pages/project'))
const Records = lazy(() => import('pages/records'))
const Blog = lazy(() => import('pages/blog'))
const Blogs = lazy(() => import('pages/blogs'))
const Editor = lazy(() => import('pages/editor'))

import './style/base.scss'
import './style/fonts/imports.scss'

const Dash: Component<RouteSectionProps> = P => {
    return (
        <div class='dash-fnd'>
            <Sidebar />
            <div class='content-fnd'>{P.children}</div>
        </div>
    )
}

const Root = () => {
    const prefersDarkColorScheme = () =>
        matchMedia && matchMedia('(prefers-color-scheme: dark)').matches

    onMount(() => {
        if (prefersDarkColorScheme()) {
            // debug
            // setTheme('dark')
        }
        setTheme('light')
    })

    createEffect(() => {
        document.documentElement.setAttribute('data-theme', theme())
    })
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
