import { BlogModel, ProjectModel, RecordModel } from 'models'
import './style/project.scss'
import { createStore, produce } from 'solid-js/store'
import { Show, createEffect } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'
import { Confact } from 'comps'
import { TrashIcon } from 'icons'

export default () => {
    type State = {
        edit_name: boolean
        project: ProjectModel
        blogs: BlogModel[]
        records: RecordModel[]
    }
    const [state, setState] = createStore<State>({
        edit_name: false,
        project: {
            id: 0,
            user: 0,
            name: '',
            storage: 0,
            blog_count: 0,
            record_count: 0,
            created_at: 0,
            updated_at: 0,
            api_key: null,
        },
        blogs: [],
        records: [],
    })
    const params = useParams()
    const nav = useNavigate()
    let input_name: HTMLInputElement
    createEffect(() => {
        if (!state.edit_name) return
        input_name.focus()
    })

    createEffect(() => {
        let id = parseInt(params.pid)
        if (isNaN(id)) nav('/projects/')

        httpx({
            url: `/api/projects/${id}/`,
            method: 'GET',
            onLoad(x) {
                if (x.status != 200) return nav('/projects/')
                setState({ project: x.response })
            },
        })
    })

    createEffect(() => {
        if (!state.project.id) return

        httpx({
            url: `/api/projects/${state.project.id}/blogs/`,
            method: 'GET',
            params: { page: 0 },
            onLoad(x) {
                if (x.status != 200) return
                setState({ blogs: x.response })
            },
        })

        httpx({
            url: `/api/projects/${state.project.id}/records/`,
            method: 'GET',
            params: { page: 0 },
            onLoad(x) {
                if (x.status != 200) return
                setState({ records: x.response })
            },
        })
    })

    function project_update(data: Pick<ProjectModel, 'name'>) {
        httpx({
            url: `/api/projects/${state.project.id}/`,
            method: 'PATCH',
            json: data,
            onLoad(x) {
                if (x.status != 200) {
                    setState({ edit_name: false })
                    return
                }

                setState(
                    produce(s => {
                        s.project.name = data.name
                        s.edit_name = false
                    })
                )
            },
        })
    }

    function project_delete() {
        httpx({
            url: `/api/projects/${state.project.id}/`,
            method: 'DELETE',
            onLoad(x) {
                if (x.status != 200) return
                nav('/projects/')
            },
        })
    }

    function blog_add() {
        httpx({
            url: `/api/projects/${state.project.id}/blogs/`,
            method: 'POST',
            onLoad(x) {
                if (x.status != 200) return
                nav(`/projects/${state.project.id}/blogs/${x.response.id}`)
            },
        })
    }

    return (
        <div class='project-fnd'>
            <div class='project-info'>
                <span>نام:</span>
                <div class='name'>
                    <Show
                        when={state.edit_name}
                        fallback={
                            <span
                                style={{ cursor: 'pointer' }}
                                onClick={() => setState({ edit_name: true })}
                            >
                                {state.project.name}
                            </span>
                        }
                    >
                        <input
                            class='styled'
                            ref={input_name}
                            value={state.project.name}
                            dir='auto'
                            placeholder='نام شما'
                            maxLength={256}
                            onChange={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                project_update({ name: e.currentTarget.value })
                            }}
                            onBlur={() => setState({ edit_name: false })}
                            onContextMenu={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                setState({ edit_name: false })
                            }}
                        />
                    </Show>
                    <Confact
                        icon={TrashIcon}
                        onAct={project_delete}
                        color='var(--red)'
                        timer_ms={2e3}
                    />
                </div>

                <span>بلاگ ها:</span>
                <span class='n'>
                    {state.project.blog_count.toLocaleString()}
                </span>
                <span>فایل ها:</span>
                <span class='n'>
                    {state.project.record_count.toLocaleString()}
                </span>
                <span>فضا:</span>
                <span class='n'>{fmt_bytes(state.project.storage)}</span>
                <span>تاریخ شروع:</span>
                <span class='n'>{fmt_datetime(state.project.created_at)}</span>
                <span>تاریخ آپدیت:</span>
                <span class='n'>{fmt_datetime(state.project.updated_at)}</span>
            </div>
            <div class='blogs'>
                <div class='actions'>
                    <button class='add-btn styled' onClick={blog_add}>
                        بلاگ جدید
                    </button>
                    <button class='styled' onClick={() => nav('blogs')}>
                        بلاگ ها
                    </button>
                </div>
                <div class='blog-list'>
                    {state.blogs.slice(0, 3).map(b => (
                        <div class='blog' onClick={() => nav('blogs/' + b.id)}>
                            <div class='thumbnail'>{b.thumbnail + ''}</div>
                            <div class='blog-info'>
                                <span>شماره:</span>
                                <span class='n'>{b.id}</span>
                                <span>نشانه:</span>
                                <span class='n'>{b.slug}</span>
                                <span>تاریخ شروع:</span>
                                <span class='n'>
                                    {fmt_datetime(state.project.created_at)}
                                </span>
                                <span>تاریخ آپدیت:</span>
                                <span class='n'>
                                    {fmt_datetime(state.project.updated_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
