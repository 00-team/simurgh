import { A } from '@solidjs/router'
import { Editable, ThemeSwtich } from 'comps'
import { ArrowIcon, LogoGood, LogoutIcon, ProjectIcon } from 'icons'
import { createEffect, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { self, setSelf } from 'store'
import './style/sidebar.scss'
import * as a from 'abi'

export default () => {
    return (
        <div class='sidebar-fnd'>
            <A class='logo' href='/'>
                <LogoGood />
            </A>
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
                    <A href='/admin/projects/'>
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
                onclick={async () => {
                    let r = await a.api_user_logout_post()
                    if (r.ok()) location.reload()
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
    let input_name!: HTMLInputElement
    createEffect(() => {
        if (!state.edit_name) return
        input_name.focus()
    })

    async function update_name(name: string) {
        let r = await a.api_user_patch({ name })
        if (r.err()) return
        setSelf({ user: r.body })
        setState({ edit_name: false })
    }

    return (
        <div class='user'>
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
