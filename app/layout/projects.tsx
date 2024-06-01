import { useNavigate, useSearchParams } from '@solidjs/router'
import './style/projects.scss'
import { ProjectModel } from 'models'
import { createStore } from 'solid-js/store'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'
import { Show, createEffect } from 'solid-js'
import { ChevronLeftIcon, ChevronRightIcon } from 'icons'

export default () => {
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
            url: '/api/projects/',
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
            <div class='actions'>
                <div>
                    <button
                        class='styled icon'
                        onClick={() => change_page(-1)}
                        disabled={state.page == 0}
                    >
                        <ChevronLeftIcon />
                    </button>
                    <button
                        class='styled icon'
                        onClick={() => change_page(+1)}
                        disabled={state.projects.length < 31}
                    >
                        <ChevronRightIcon />
                    </button>
                </div>
                <div>
                    <button class='styled' onClick={projects_new}>
                        پروژه جدید
                    </button>
                </div>
            </div>
            <Show when={!state.loading && state.projects.length == 0}>
                <div class='message'>پروژه ای یافت نشد</div>
            </Show>
            <div class='project-list'>
                {state.projects.map(p => (
                    <div
                        class='project'
                        onClick={() => nav('/projects/' + p.id)}
                    >
                        <span>نام:</span>
                        <span>{p.name}</span>
                        <span>بلاگ ها:</span>
                        <span class='n'>{p.blog_count.toLocaleString()}</span>
                        <span>فایل ها:</span>
                        <span class='n'>{p.record_count.toLocaleString()}</span>
                        <span>فضا:</span>
                        <span class='n'>{fmt_bytes(p.storage)}</span>
                        <span>تاریخ شروع:</span>
                        <span class='n'>{fmt_datetime(p.created_at)}</span>
                        <span>تاریخ آپدیت:</span>
                        <span class='n'>{fmt_datetime(p.updated_at)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
