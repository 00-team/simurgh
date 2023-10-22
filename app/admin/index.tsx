import { SendIcon } from '!/icons/actions'
import { ProjectsIcon, SiteIcon } from '!/icons/dashboard'
import { user } from '!/stores'
import { A, Outlet } from '@solidjs/router'
import { createEffect } from 'solid-js'

import './style/index.scss'

export default () => {
    createEffect(() => {
        if (user.user_id && !user.perms) {
            location.replace('/')
            return
        }
    })

    return (
        <main class='admin-container'>
            <aside class='sidebar'>
                <div class='avatar'>
                    <img
                        src={
                            !user.picture
                                ? '/static/image/dashboard/empty_avatar.webp'
                                : '/records/users/' + user.picture
                        }
                        class='profile-avatar'
                        alt=''
                    />
                    <h2 class='name-avatar title_small'>
                        <span>{user.name}</span>
                    </h2>
                </div>
                <div class='sidebar-wrapper'>
                    <A
                        class='column-wrapper title_small'
                        href='/admin/projects'
                    >
                        <ProjectsIcon />
                        <span>پروژه ها</span>
                        <SendIcon />
                    </A>
                    <A class='column-wrapper goto title_small' href='/'>
                        <SiteIcon />
                        <span>رفتن به سایت</span>
                        <SendIcon />
                    </A>
                </div>
            </aside>
            <aside class='wrapper'>
                <Outlet />
            </aside>
        </main>
    )
}

// ;<div class='img-wrapper'>
//     <div
//         class='img'
//         style={{
//             'background-image':
//                 'url(' +
//                 (!user.picture
//                     ? '/static/image/cyprus/thief.png'
//                     : '/records/users/' + user.picture) +
//                 ')',
//         }}
//     />
// </div>
