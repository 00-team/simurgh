import { useParams } from '@solidjs/router'
import './style/projects.scss'
import { ProjectModel } from 'models'
import { createStore } from 'solid-js/store'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'
import { createEffect } from 'solid-js'

export default () => {
    type State = {
        page: number
        projects: ProjectModel[]
    }
    const [state, setState] = createStore<State>({ page: 0, projects: [] })
    const UP = useParams()

    createEffect(() => {
        fetch_projects(parseInt(UP.page || '0') || 0)
    })

    function fetch_projects(page: number) {
        httpx({
            url: '/api/projects/',
            method: 'GET',
            params: { page },
            onLoad(x) {
                if (x.status != 200) return
                setState({ projects: x.response, page })
            },
        })
    }

    return (
        <div class='projects-fnd'>
            <div class='actions'>
                <button class='styled'>پروژه جدید</button>
            </div>
            <div class='project-list'>
                {state.projects
                    .concat(state.projects)
                    .concat(state.projects)
                    .concat(state.projects)
                    .concat(state.projects)
                    .concat(state.projects)
                    .concat(state.projects)
                    .map(p => (
                        <div class='project'>
                            <span>نام:</span>
                            <span>{p.name}</span>
                            <span>بلاگ ها:</span>
                            <span class='n'>
                                {p.blog_count.toLocaleString()}
                            </span>
                            <span>فایل ها:</span>
                            <span class='n'>
                                {p.record_count.toLocaleString()}
                            </span>
                            <span>فضا:</span>
                            <span class='n'>{fmt_bytes(p.storage)}</span>
                            <span>تاریخ:</span>
                            <span class='n'>{fmt_datetime(p.timestamp)}</span>
                        </div>
                    ))}
            </div>
        </div>
    )
}
