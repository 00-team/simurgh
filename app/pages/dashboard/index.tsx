import { ProjectIcon } from '!/icons/dashboard'
import { Component, JSXElement } from 'solid-js'

import './style/dashboard.scss'

const Dashboard: Component = () => {
    type sectionRow = {
        title: string
        Icon: ({ size }) => JSXElement
    }

    const sidebarRows: sectionRow[] = [
        {
            title: 'Projects',
            Icon: ProjectIcon,
        },
    ]

    return (
        <main class='dashboard'>
            <aside class='sidebar'>
                <div class='user'>
                    <img
                        class='user-avatar'
                        src='/static/image/dashboard/wallpaper.webp'
                    />
                    <p class='user-name title'>Sadra Taghavi</p>
                </div>

                <div class='options'>
                    {sidebarRows.map(({ title, Icon }) => {
                        return (
                            <div class='option '>
                                <div class='icon'>
                                    <Icon size={25} />
                                </div>
                                <span class='title' data-text={title}>
                                    {title}
                                    <div class='line'></div>
                                </span>
                                <div></div>
                            </div>
                        )
                    })}
                </div>

                <div class='exit title'>
                    <object
                        data='/static/svg/dashboard/door.svg'
                        type='image/svg+xml'
                    ></object>
                    Exit
                    <div></div>
                </div>
            </aside>

            <aside
                onmousemove={e => {
                    e.currentTarget.style.transition = 'none'

                    var moveinX = (e.clientX * -1) / 100
                    var moveinY = (e.clientY * -1) / 100

                    e.currentTarget.style.backgroundPosition = `${moveinX}px ${moveinY}px`
                }}
                onmouseleave={e => {
                    e.currentTarget.style.transition = '0.3s ease'
                    e.currentTarget.style.backgroundPosition = '0 0'
                }}
                class='wrapper'
                style={{
                    'background-image':
                        'url(/static/image/dashboard/wallpaper.webp)',
                }}
            ></aside>
        </main>
    )
}

export default Dashboard