import { useNavigate, useSearchParams } from '@solidjs/router'
import { ChevronLeftIcon, ChevronRightIcon } from 'icons'
import { ProjectModel } from 'models'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'
import { Component, createEffect, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import './style/projects.scss'

type Props = { admin?: true }
const Projects: Component<Props> = P => {
    type State = {
        page: number
        projects: ProjectModel[]
        loading: boolean
    }
    const [state, setState] = createStore<State>({
        page: 0,
        projects: [],
        loading: true,
    })
    const [params, setParams] = useSearchParams()
    const nav = useNavigate()

    createEffect(() => {
        let page = parseInt(params.page || '0') || 0
        projects_list(page)
    })

    function projects_list(page: number) {
        if (page < 0) page = 0

        setParams({ page })
        setState({ loading: true })
        httpx({
            url: P.admin ? '/api/admin/projects/' : '/api/projects/',
            method: 'GET',
            params: { page },
            onLoad(x) {
                if (x.status != 200) return
                setState({ projects: x.response, page, loading: false })
            },
        })
    }

    function projects_new() {
        httpx({
            url: '/api/projects/',
            method: 'POST',
            json: { name: 'پروژه جدید' },
            onLoad(x) {
                if (x.status != 200) return
                projects_list(state.page)
            },
        })
    }

    function change_page(update: number) {
        projects_list(state.page + update)
    }

    return (
        <div class='projects-fnd'>
            <Show when={!state.loading && state.projects.length == 0}>
                <div class='message section_title not-found'>
                    پروژه ای یافت نشد
                    <button
                        class='new-project title_small'
                        onClick={projects_new}
                    >
                        پروژه جدید
                    </button>
                </div>
            </Show>
            <div class='project-list'>
                {state.projects.length >= 1 && (
                    <button
                        class='new-project title_small'
                        onClick={projects_new}
                    >
                        پروژه جدید
                    </button>
                )}
                <div class='projects-wrapper'>
                    {state.projects.map(p => (
                        <div
                            class='project title_small'
                            onClick={() => nav('/projects/' + p.id)}
                        >
                            <div class='project-name title'>
                                <span>{p.name}</span>
                            </div>
                            <div class='row'>
                                <span>شماره:</span>
                                <span class='n'>{p.id}</span>
                            </div>
                            <div class='row'>
                                <span>بلاگ ها:</span>
                                <span class='n'>
                                    {p.blog_count.toLocaleString()}
                                </span>
                            </div>
                            <div class='row'>
                                <span>فایل ها:</span>
                                <span class='n'>
                                    {p.record_count.toLocaleString()}
                                </span>
                            </div>
                            <div class='row '>
                                <span>فضا:</span>
                                <span class='n space'>
                                    {fmt_bytes(p.storage)}
                                </span>
                            </div>
                            <div class='row'>
                                <span>تاریخ شروع:</span>
                                <span class='date'>
                                    {fmt_datetime(p.created_at)}
                                </span>
                            </div>
                            <div class='row'>
                                <span>تاریخ آپدیت:</span>
                                <span class='n'>
                                    {fmt_datetime(p.updated_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div class='actions'>
                <div>
                    <button
                        class='icon'
                        classList={{ disable: state.projects.length < 31 }}
                        onClick={() => change_page(+1)}
                        disabled={state.projects.length < 31}
                    >
                        <ChevronRightIcon />
                    </button>
                    <button
                        class='icon'
                        onClick={() => change_page(-1)}
                        classList={{ disable: state.projects.length < 31 }}
                        disabled={state.page == 0}
                    >
                        <ChevronLeftIcon />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Projects
