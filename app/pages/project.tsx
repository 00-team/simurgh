import { useNavigate, useParams } from '@solidjs/router'
import { addAlert, Editable } from 'comps'
import {
    ArrowLeftIcon,
    CopyIcon,
    FileIcon,
    ImageIcon,
    RecycleIcon,
    TrashIcon,
} from 'icons'
import { fmt_bytes, fmt_datetime, record_url } from 'shared'
import { Component, createEffect, Show } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { setPopup } from 'store/popup'
import './style/project.scss'

import * as a from 'abi'

export default () => {
    type State = {
        edit_name: boolean
        project: a.Project
    }
    const [state, setState] = createStore<State>({
        edit_name: false,
        project: {
            id: 0,
            owner: null,
            blog_category_count: 0,
            blog_tag_count: 0,
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
    let input_name!: HTMLInputElement
    createEffect(() => {
        if (!state.edit_name) return
        input_name.focus()
    })

    createEffect(() => {
        let id = parseInt(params.pid)
        if (isNaN(id)) nav('/projects/')

        a.api_projects_get({ id }).then(r => {
            if (r.err()) return nav('/projects/')
            setState({ project: r.body })
        })
    })

    async function project_update(data: a.ProjectUpdateBody) {
        let r = await a.api_projects_patch({ id: state.project.id }, data)
        if (r.err()) return

        setState(
            produce(s => {
                s.project = r.body
                s.edit_name = false
            })
        )
    }

    async function project_delete() {
        let r = await a.api_projects_del({ id: state.project.id })
        if (r.err()) return
        nav('/projects/')
    }

    return (
        <div class='project-fnd'>
            <div class='actions'>
                <div>
                    <button
                        class='  go-back icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav('/projects/')}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
            </div>
            <div class='project-info title_small'>
                <div class='ctas'>
                    <button
                        class='cta delete-project title_smaller'
                        onClick={() =>
                            setPopup({
                                show: true,
                                content: 'از حذف پروژه مطمعنید؟',
                                Icon: TrashIcon,
                                onSubmit: () => project_delete(),
                                type: 'error',
                                title: 'حذف پروژه',
                            })
                        }
                    >
                        <TrashIcon />
                        حذف پروژه
                    </button>
                </div>
                <div class='row'>
                    <span>نام:</span>
                    <div class='name'>
                        <Show
                            when={state.edit_name}
                            fallback={
                                <Editable
                                    onClick={() =>
                                        setState({ edit_name: true })
                                    }
                                >
                                    <span
                                        dir='auto'
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {state.project.name}
                                    </span>
                                </Editable>
                            }
                        >
                            <input
                                class='styled title_small'
                                ref={input_name}
                                value={state.project.name}
                                dir='auto'
                                placeholder='نام شما'
                                maxLength={256}
                                onChange={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    project_update({
                                        name: e.currentTarget.value,
                                    })
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

                <div class='row'>
                    <span>شماره:</span>
                    <span class='n'>{state.project.id}</span>
                </div>
                <div class='row'>
                    <span>بلاگ ها:</span>
                    <span class='n'>
                        {state.project.blog_count.toLocaleString()}
                    </span>
                </div>
                <div class='row'>
                    <span>فایل ها:</span>
                    <span class='n'>
                        {state.project.record_count.toLocaleString()}
                    </span>
                </div>
                <div class='row'>
                    <span>فضا:</span>
                    <span class='n'>{fmt_bytes(state.project.storage)}</span>
                </div>

                <div class='row'>
                    <span>تاریخ شروع:</span>
                    <span class='n'>
                        {fmt_datetime(state.project.created_at)}
                    </span>
                </div>
                <div class='row'>
                    <span>تاریخ آپدیت:</span>
                    <span class='n'>
                        {fmt_datetime(state.project.updated_at)}
                    </span>
                </div>
                <div class='row'>
                    <span>api key:</span>
                    <div class='api'>
                        <div
                            class='re-gen'
                            onclick={() =>
                                project_update({
                                    name: state.project.name,
                                    api_key: true,
                                })
                            }
                        >
                            <RecycleIcon />
                        </div>
                        <div
                            class='wrapper'
                            onclick={() => {
                                try {
                                    navigator.clipboard.writeText(
                                        state.project.api_key || 'no api key'
                                    )

                                    addAlert({
                                        type: 'success',
                                        content: 'با موفقیت کپی شد',
                                        subject: 'موفق!',
                                        timeout: 3,
                                    })
                                } catch {
                                    addAlert({
                                        type: 'error',
                                        content: 'کپی کردن با مشکل مواجه شد',
                                        subject: 'خطا!',
                                        timeout: 3,
                                    })
                                }
                            }}
                        >
                            <CopyIcon />
                            <p>{state.project.api_key}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class='actions-cta'>
                <Blogs project={state.project} />
                <Records project={state.project} />
            </div>
        </div>
    )
}
type BlogProps = {
    project: a.Project
}
const Blogs: Component<BlogProps> = P => {
    type State = {
        blogs: a.Blog[]
    }
    const [state, setState] = createStore<State>({
        blogs: [],
    })

    const nav = useNavigate()

    createEffect(() => {
        if (!P.project.id) return

        a.api_projects_blogs_list(
            { pid: P.project.id, page: 0 },
            { show_alert: false }
        ).then(r => {
            if (r.err()) return
            setState({ blogs: r.body })
        })
    })

    async function blog_add() {
        let r = await a.api_projects_blogs_post({ pid: P.project.id })
        if (r.err()) return
        nav(`/projects/${P.project.id}/blogs/${r.body.id}`)
    }

    return (
        <div class='blogs'>
            <div class='actions'>
                <button
                    class='styled title_smaller'
                    onClick={() => nav('blogs/')}
                >
                    بلاگ ها
                </button>
                <button class='add-btn styled title_smaller' onClick={blog_add}>
                    بلاگ جدید
                </button>
                <button
                    class='new-blog title_small'
                    onclick={() => nav('blogs-categories/')}
                >
                    دسته بندی ها
                </button>
                <button
                    class='new-blog title_small'
                    onclick={() => nav('blogs-tags/')}
                >
                    تگ ها
                </button>
            </div>
            <div class='blog-list'>
                {state.blogs.slice(0, 3).map(b => (
                    <div
                        class='blog'
                        classList={{ draft: b.status === 'draft' }}
                        onClick={() => nav('blogs/' + b.id)}
                    >
                        <div class='thumbnail'>
                            <Show
                                when={b.thumbnail && b.thumbnail_url}
                                fallback={<ImageIcon />}
                            >
                                <img
                                    draggable={false}
                                    loading='lazy'
                                    decoding='async'
                                    src={b.thumbnail_url!}
                                />
                            </Show>
                        </div>
                        <div class='blog-info title_smaller'>
                            <div class='blog-title title_smaller'>
                                {b.title || '---'}
                            </div>
                            <div class='row'>
                                <span>شناسه:</span>
                                <span class='n'>{b.id}</span>
                            </div>
                            {/*<span>نشانه:</span>
                            <span class='n'>{b.slug}</span>
                            <span>تاریخ آپدیت:</span>
                            <span class='n'>{fmt_datetime(b.updated_at)}</span>
                            */}
                            <div class='row'>
                                <span>تاریخ شروع:</span>
                                <span class='n'>
                                    {fmt_datetime(b.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

type RecordProps = {
    project: a.Project
}
const Records: Component<RecordProps> = P => {
    type State = {
        records: a.Record[]
    }
    const [state, setState] = createStore<State>({
        records: [],
    })

    const nav = useNavigate()

    createEffect(() => {
        if (!P.project.id) return

        a.api_projects_records_list(
            { pid: P.project.id, page: 0 },
            { show_alert: false }
        ).then(r => {
            if (r.err()) return
            setState({ records: r.body })
        })
    })

    function record_add() {
        let el = document.createElement('input')
        el.setAttribute('type', 'file')
        el.onchange = () => {
            if (!el.files || !el.files[0]) return

            for (let f of el.files) {
                alert(f.type)
            }

            // let data = new FormData()
            // data.set('record', el.files[0])
            //
            // a.api_projects_records_photo_post()
            //
            // httpx({
            //     url: `/api/projects/${P.project.id}/records/`,
            //     method: 'POST',
            //     data,
            //     onLoad(x) {
            //         if (x.status != 200) return
            //         nav('records/')
            //     },
            // })
        }
        el.click()
    }

    return (
        <div class='records'>
            <div class='actions'>
                <button
                    class='styled title_smaller'
                    onClick={() => nav('records/')}
                >
                    فایل ها
                </button>
                <button
                    class='add-btn styled title_smaller'
                    onClick={record_add}
                >
                    فایل جدید
                </button>
            </div>
            <div class='record-list'>
                {state.records.slice(0, 3).map(r => (
                    <div class='record' onClick={() => nav('records/')}>
                        <div class='dpy'>
                            <Show
                                when={r.kind == 'photo'}
                                fallback={<FileIcon />}
                            >
                                <img
                                    draggable={false}
                                    loading='lazy'
                                    decoding='async'
                                    src={record_url(r)}
                                />
                            </Show>
                        </div>
                        <div class='record-info title_smaller'>
                            <div class='row'>
                                <span>شناسه:</span>
                                <span class='n'>{r.id}</span>
                            </div>
                            <div class='row'>
                                <span>حجم:</span>
                                <span class='n'>{fmt_bytes(r.size)}</span>
                            </div>
                            <div class='row'>
                                <span>نوع:</span>
                                <span class='n'>{r.kind}</span>
                            </div>
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
