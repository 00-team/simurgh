import { Show } from 'solid-js'
import './style/sidebar.scss'
import { self } from 'store'
import { UserIcon } from 'icons'

export default () => {
    function update_photo() {}

    function delete_photo() {}

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
                            src={`/record/${self.user.id}:${self.user.photo}/`}
                            draggable={false}
                        />
                    </Show>
                </div>
                <span class='name'>{self.user.name || '---'}</span>
            </div>
        </div>
    )
}
