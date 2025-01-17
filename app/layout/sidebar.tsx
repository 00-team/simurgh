import { A } from '@solidjs/router'
import { Editable, ThemeSwtich } from 'comps'
import { ArrowIcon, LogoutIcon, ProjectIcon, UserIcon } from 'icons'
import { httpx } from 'shared'
import { createEffect, Show } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { self, setSelf } from 'store'
import './style/sidebar.scss'

export default () => {
    return (
        <div class='sidebar-fnd'>
            <User />
            <ThemeSwtich />
            <div class='links title_smaller'>
                <A href='/projects/'>
                    <div class='holder'>
                        <ProjectIcon />
                        پروژه ها
                    </div>
                    <ArrowIcon />
                </A>
                <Show when={self.user.admin}>
                    <A href='/admin-projects/'>
                        <div class='holder'>
                            <ProjectIcon />
                            همه پروژه ها
                        </div>
                        <ArrowIcon />
                    </A>
                </Show>
            </div>
            <div
                class='logout title'
                onclick={() => {
                    httpx({
                        url: '/api/user/logout/',
                        method: 'POST',
                        onLoad(x) {
                            if (x.status == 200) {
                                location.reload()

                                setSelf({
                                    loged_in: true,
                                    fetch: false,
                                    user: x.response,
                                })
                            }
                        },
                    })
                }}
            >
                <div class='holder'>
                    <LogoutIcon />
                    خروج
                </div>
                <ArrowIcon />
            </div>
        </div>
    )
}

const User = () => {
    type State = {
        edit_name: boolean
    }
    const [state, setState] = createStore<State>({
        edit_name: false,
    })
    let input_name: HTMLInputElement
    createEffect(() => {
        if (!state.edit_name) return
        input_name.focus()
    })

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
        // @ts-ignore
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
                    setState({ edit_name: false })
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
                <Editable img>
                    <Show when={self.user.photo} fallback={<UserIcon />}>
                        <img
                            src={`/simurgh-record/up-${self.user.id}-${self.user.photo}?r=${~~performance.now()}`}
                            draggable={false}
                        />
                    </Show>
                </Editable>
            </div>
            <div class='name'>
                <Show
                    when={state.edit_name}
                    fallback={
                        <Editable onClick={() => setState({ edit_name: true })}>
                            <span class='title_small'>
                                {self.user.name || 'اسم شما'}
                            </span>
                        </Editable>
                    }
                >
                    <input
                        ref={input_name}
                        dir='auto'
                        class='styled title_smaller'
                        placeholder='نام شما'
                        value={self.user.name || ''}
                        maxLength={256}
                        onChange={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            update_name(e.currentTarget.value)
                        }}
                        onBlur={() => setState({ edit_name: false })}
                        onContextMenu={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            setState({ edit_name: false })
                        }}
                    />
                </Show>
            </div>
        </div>
    )
}
