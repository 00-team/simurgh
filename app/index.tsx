import { Route, Router, RouteSectionProps } from '@solidjs/router'
import { Component, lazy } from 'solid-js'
import { render, Show } from 'solid-js/web'

import { Alert, Popup } from 'comps'
import { self } from 'store'

import Sidebar from 'layout/sidebar'
import NotFound from 'pages/404'
import Login from 'pages/login'
import Projects from 'pages/projects'
const Project = lazy(() => import('pages/project'))
const Records = lazy(() => import('pages/records'))
const Categories = lazy(() => import('pages/categories'))
const Tags = lazy(() => import('pages/tags'))
const Blog = lazy(() => import('pages/blog'))
const Blogs = lazy(() => import('pages/blogs'))
const Editor = lazy(() => import('pages/editor'))
const Home = lazy(() => import('pages/home'))

import './style/base.scss'
import './style/fonts/imports.scss'

const Dash: Component<RouteSectionProps> = P => {
    return (
        <div class='dash-fnd'>
            <Sidebar />
            <div class='content-fnd'>
                {P.children}
                <Popup />
            </div>
        </div>
    )
}

const Root = () => {
    return (
        <>
            <Show when={self.loged_in} fallback={<Login />}>
                <Router>
                    <Route path='/' component={() => <Home />} />
                    <Show when={self.user.admin}>
                        <Route path='/admin' component={Dash}>
                            <Route
                                path='/projects'

                                component={() => <Projects admin />}
                            />
                        </Route>
                    </Show>
                    <Route path='/projects' component={Dash}>
                        <Route path='/' component={() => <Projects />} />
                        <Route path='/:pid' matchFilters={{ pid: /^\d+$/ }}>
                            <Route path='/' component={Project} />
                            <Route path='/records/' component={Records} />
                            <Route
                                path='/blogs-categories/'
                                component={Categories}
                            />
                            <Route path='/blogs-tags/' component={Tags} />
                            <Route path='/blogs' component={Blogs} />
                            <Route
                                path='/blogs/:bid'
                                matchFilters={{ bid: /^\d+$/ }}
                            >
                                <Route path='/' component={Blog} />
                                <Route path='/editor/' component={Editor} />
                            </Route>
                        </Route>
                    </Route>
                    <Route path='*' component={NotFound} />
                </Router>
            </Show>
            <Alert />
        </>
    )
}

render(Root, document.getElementById('root')!)
