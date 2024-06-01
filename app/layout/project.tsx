import { ProjectModel } from 'models'
import './style/project.scss'
import { createStore, produce } from 'solid-js/store'
import { Show, createEffect } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'

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

    createEffect(() => {
        let id = parseInt(params.id)
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
                if (x.status != 200) return

                setState(
                    produce(s => {
                        s.project.name = data.name
                    })
                )
            },
        })
    }

    return (
        <div class='project-fnd'>
            <div class='info'>
                <span>نام:</span>
                <Show
                    when={state.edit_name}
                    fallback={
                        <span onClick={() => setState({ edit_name: true })}>
                            {state.project.name}
                        </span>
                    }
                >
                    <input
                        class='styled'
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
            <div class='blog-list'></div>
        </div>
    )
}
