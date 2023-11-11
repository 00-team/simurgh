import { BlogIcon, ExitIcon, ProjectIcon } from '!/icons/dashboard'
import { setUser } from '!/stores'
import { Link, Outlet, useNavigate } from '@solidjs/router'
import { Component, JSXElement } from 'solid-js'

import './style/dashboard.scss'

const Dashboard: Component = () => {
    // TODO: uncomment this later

    // onMount(() => {
    //     if (!user || !user.user_id) return navigate('/')
    // })

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
    const navigate = useNavigate()

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
                    src='/static/image/dashboard/wallpaper.webp'
                />
                <p class='user-name title'>Sadra Taghavi</p>
            </div>

            <div class='options'>
                {sidebarRows.map(({ title, Icon, link }) => {
                    return (
                        <Link href={`/${link}`} class='option '>
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

            <button
                class='exit title'
                onclick={() => {
                    setUser({
                        user_id: 0,
                        name: '',
                        email: '',
                        picture: null,
                        phone: null,
                        admin: null,
                        token: null,
                        perms: 0n,
                    })
                    navigate('/login')

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
