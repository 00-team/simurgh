import { ProjectIcon } from '!/icons/dashboard'
import { Component } from 'solid-js'

import './style/dashboard.scss'

const Dashboard: Component = () => {
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
                    <div class='option '>
                        <div class='icon'>
                            <ProjectIcon />
                        </div>
                        <span class='title' data-text='Projects'>
                            Projects
                        </span>
                        <div></div>
                    </div>
                </div>

                <div></div>
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
