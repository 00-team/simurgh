import { BlogIcon, ExitIcon, PersonIcon, ProjectIcon } from '!/icons/dashboard'
import { setUser, user } from '!/stores'
import { A, useNavigate } from '@solidjs/router'
import { Component, createEffect, JSXElement, onMount } from 'solid-js'
import { RouteSectionProps } from '@solidjs/router'

import './style/dashboard.scss'

const Dashboard: Component<RouteSectionProps> = P => {
    const navigate = useNavigate()

    // if (user && user.user_id === 0) navigate('/login')

    return (
        <main class='dashboard'>
            <Sidebar />
            <aside class='wrapper'>{P.children}</aside>
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
            title: 'My Info',
            Icon: PersonIcon,
            link: 'info',
        },
        {
            title: 'Projects',
            Icon: ProjectIcon,
            link: 'projects',
        },
        {
            title: 'Blogs',
            Icon: BlogIcon,
            link: 'blogs',
        },
    ]

    return (
        <aside class='sidebar'>
            <div class='user'>
                <img
                    class='user-avatar'
                    src={
                        user.picture || '/static/image/dashboard/wallpaper.webp'
                    }
                />
                <p class='user-name title'>{user.name}</p>
            </div>

            <div class='options'>
                {sidebarRows.map(({ title, Icon, link }) => {
                    return (
                        <A href={`/${link}`} class='option '>
                            <div class='icon'>
                                <Icon size={25} />
                            </div>
                            <span class='title' data-text={title}>
                                {title}
                                <div class='line'></div>
                            </span>
                            <div></div>
                        </A>
                    )
                })}
            </div>

            <button
                class='exit title'
                onclick={() => {
                    document.cookie =
                        'Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
                    setUser({
                        user_id: 0,
                        name: '',
                        email: '',
                        picture: null,
                        admin: null,
                        token: null,
                        perms: 0n,
                    })
                    console.log(user)

                    return
                }}
            >
                <ExitIcon size={30} />
                Exit
                <div></div>
            </button>
        </aside>
    )
}

export default Dashboard
