import { Show, createSignal } from 'solid-js'
import './style/sidebar.scss'
import { self, setSelf } from 'store'
import { UserIcon } from 'icons'
import { httpx } from 'shared'
import { createStore, produce } from 'solid-js/store'

export default () => {
    return (
        <div class='sidebar-fnd'>
            <User />
        </div>
    )
}

const User = () => {
    const [editing, setEditing] = createSignal(false)

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

    function update_name(name: string) {
        httpx({
            url: '/api/user/',
            method: 'PATCH',
            json: { name },
            onLoad(x) {
                if (x.status == 200) {
                    setSelf({ user: x.response })
                    setEditing(false)
                }
            },
        })
    }

    return (
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
                        src={`/record/${self.user.id}:${self.user.photo}/?x=${~~performance.now()}`}
                        draggable={false}
                    />
                </Show>
            </div>
            <div class='name' onclick={() => setEditing(true)}>
                <Show
                    when={editing()}
                    fallback={<span>{self.user.name || '---'}</span>}
                >
                    <input
                        dir='auto'
                        class='styled'
                        placeholder='نام شما'
                        value={self.user.name || ''}
                        maxLength={256}
                        onChange={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            update_name(e.currentTarget.value)
                        }}
                        onBlur={() => setEditing(false)}
                        onContextMenu={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            setEditing(false)
                        }}
                    />
                </Show>
            </div>
        </div>
    )
}
