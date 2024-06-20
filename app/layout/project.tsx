import { BlogModel, ProjectModel, RecordModel } from 'models'
import './style/project.scss'
import { createStore, produce } from 'solid-js/store'
import { Component, Show, createEffect } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'
import { Confact, Editable } from 'comps'
import { FileIcon, ImageIcon, TrashIcon } from 'icons'

export default () => {
    type State = {
        edit_name: boolean
        project: ProjectModel
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
                        s.project = x.response
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

    return (
        <div class='project-fnd'>
            <div class='project-info'>
                <span>نام:</span>
                <div class='name'>
                    <Show
                        when={state.edit_name}
                        fallback={
                            <Editable
                                onClick={() => setState({ edit_name: true })}
                            >
                                <span style={{ cursor: 'pointer' }}>
                                    {state.project.name}
                                </span>
                            </Editable>
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
            <Blogs project={state.project} />
            <Records project={state.project} />
        </div>
    )
}
type BlogProps = {
    project: ProjectModel
}
const Blogs: Component<BlogProps> = P => {
    type State = {
        blogs: BlogModel[]
    }
    const [state, setState] = createStore<State>({
        blogs: [],
    })

    const nav = useNavigate()

    createEffect(() => {
        if (!P.project.id) return
        httpx({
            url: `/api/projects/${P.project.id}/blogs/`,
            method: 'GET',
            params: { page: 0 },
            show_messages: false,
            onLoad(x) {
                if (x.status != 200) return
                setState({ blogs: x.response })
            },
        })
    })

    function blog_add() {
        httpx({
            url: `/api/projects/${P.project.id}/blogs/`,
            method: 'POST',
            onLoad(x) {
                if (x.status != 200) return
                nav(`/projects/${P.project.id}/blogs/${x.response.id}`)
            },
        })
    }

    return (
        <div class='blogs'>
            <div class='actions'>
                <button class='add-btn styled' onClick={blog_add}>
                    بلاگ جدید
                </button>
                <button class='styled' onClick={() => nav('blogs/')}>
                    بلاگ ها
                </button>
            </div>
            <div class='blog-list'>
                {state.blogs.slice(0, 3).map(b => (
                    <div class='blog' onClick={() => nav('blogs/' + b.id)}>
                        <div class='thumbnail'>
                            <Show when={b.thumbnail} fallback={<ImageIcon />}>
                                <img
                                    draggable={false}
                                    loading='lazy'
                                    decoding='async'
                                    src={`/record/bt-${b.id}-${b.thumbnail}`}
                                />
                            </Show>
                        </div>
                        <div class='blog-info'>
                            <span>شناسه:</span>
                            <span class='n'>{b.id}</span>
                            <span>عنوان:</span>
                            <span>{b.title || '---'}</span>
                            {/*<span>نشانه:</span>
                            <span class='n'>{b.slug}</span>
                            <span>تاریخ آپدیت:</span>
                            <span class='n'>{fmt_datetime(b.updated_at)}</span>
                            */}
                            <span>تاریخ شروع:</span>
                            <span class='n'>{fmt_datetime(b.created_at)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

type RecordProps = {
    project: ProjectModel
}
const Records: Component<RecordProps> = P => {
    type State = {
        records: RecordModel[]
    }
    const [state, setState] = createStore<State>({
        records: [],
    })

    const nav = useNavigate()

    createEffect(() => {
        if (!P.project.id) return
        httpx({
            url: `/api/projects/${P.project.id}/records/`,
            method: 'GET',
            params: { page: 0 },
            show_messages: false,
            onLoad(x) {
                if (x.status != 200) return
                setState({ records: x.response })
            },
        })
    })

    function record_add() {
        let el = document.createElement('input')
        el.setAttribute('type', 'file')
        el.onchange = () => {
            if (!el.files || !el.files[0]) return

            let data = new FormData()
            data.set('record', el.files[0])

            httpx({
                url: `/api/projects/${P.project.id}/records/`,
                method: 'POST',
                data,
                onLoad(x) {
                    if (x.status != 200) return
                    nav('records/')
                },
            })
        }
        el.click()
    }

    return (
        <div class='records'>
            <div class='actions'>
                <button class='add-btn styled' onClick={record_add}>
                    فایل جدید
                </button>
                <button class='styled' onClick={() => nav('records/')}>
                    فایل ها
                </button>
            </div>
            <div class='record-list'>
                {state.records.slice(0, 3).map(r => (
                    <div class='record' onClick={() => nav('records/')}>
                        <div class='dpy'>
                            <Show
                                when={r.mime && r.mime.startsWith('image/')}
                                fallback={<FileIcon />}
                            >
                                <img
                                    draggable={false}
                                    loading='lazy'
                                    decoding='async'
                                    src={`/record/r-${r.id}-${r.salt}`}
                                />
                            </Show>
                        </div>
                        <div class='record-info'>
                            <span>شناسه:</span>
                            <span class='n'>{r.id}</span>
                            <span>حجم:</span>
                            <span class='n'>{fmt_bytes(r.size)}</span>
                            <span>نوع:</span>
                            <span class='n'>{r.mime}</span>
                            {/*
                            <span>تاریخ بارگزاری:</span>
                            <span class='n'>{fmt_datetime(r.created_at)}</span>*/}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
