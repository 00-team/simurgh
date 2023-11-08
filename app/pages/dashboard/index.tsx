import { ExitIcon, ProjectIcon } from '!/icons/dashboard'
import { Link, Outlet } from '@solidjs/router'
import { Component, JSXElement } from 'solid-js'

import './style/dashboard.scss'

const Dashboard: Component = () => {
    return (
        <main class='dashboard'>
            <Sidebar />
            <aside class='wrapper'>
                <Outlet />
            </aside>
        </main>
    )
}

const Sidebar: Component = () => {
    type sectionRow = {
        title: string
        Icon: ({ size }) => JSXElement
        link: string
    }

    const sidebarRows: sectionRow[] = [
        {
            title: 'Projects',
            Icon: ProjectIcon,
            link: 'projects',
        },
    ]

    return (
        <aside class='sidebar'>
            <div class='user'>
                <img
                    class='user-avatar'
                    src='/static/image/dashboard/wallpaper.webp'
                />
                <p class='user-name title'>Sadra Taghavi</p>
            </div>

            <div class='options'>
                {sidebarRows.map(({ title, Icon, link }) => {
                    return (
                        <Link href={`/dashboard/${link}`} class='option '>
                            <div class='icon'>
                                <Icon size={25} />
                            </div>
                            <span class='title' data-text={title}>
                                {title}
                                <div class='line'></div>
                            </span>
                            <div></div>
                        </Link>
                    )
                })}
            </div>

            <div class='exit title'>
                <ExitIcon size={30} />
                Exit
                <div></div>
            </div>
        </aside>
    )
}

export default Dashboard
