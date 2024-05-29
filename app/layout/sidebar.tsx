import { Show } from 'solid-js'
import './style/sidebar.scss'
import { self, setSelf } from 'store'
import { UserIcon } from 'icons'
import { httpx } from 'shared'
import { produce } from 'solid-js/store'

export default () => {
    function update_photo() {
        let input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('accept', 'image/*')
        input.onchange = () => {
            let file = input.files[0]
            if (!file || file.size > 8e6 || !file.type.startsWith('image/')) {
                input.remove()
                return
            }

            let data = new FormData()
            data.set('photo', file)

            httpx({
                url: '/api/user/photo/',
                method: 'PUT',
                data,
                onLoad(x) {
                    if (x.status == 200) {
                        setSelf({ user: x.response })
                    }
                },
            })
        }
        input.oncancel = () => input.remove()
        input.click()
    }

    function delete_photo() {
        if (!self.user.photo) return

        httpx({
            url: '/api/user/photo/',
            method: 'DELETE',
            onLoad(x) {
                if (x.status == 200) {
                    setSelf(
                        produce(s => {
                            s.user.photo = null
                        })
                    )
                }
            },
        })
    }

    return (
        <div class='sidebar-fnd'>
            <div class='user'>
                <div
                    class='img'
                    onclick={update_photo}
                    onContextMenu={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        delete_photo()
                    }}
                >
                    <Show when={self.user.photo} fallback={<UserIcon />}>
                        <img
                            src={`/record/${self.user.id}:${self.user.photo}/?hash=${performance.now()}`}
                            draggable={false}
                        />
                    </Show>
                </div>
                <span class='name'>{self.user.name || '---'}</span>
            </div>
        </div>
    )
}
