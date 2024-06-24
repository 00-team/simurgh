import { BlogModel } from 'models'
import './style/blogs.scss'
import { createStore } from 'solid-js/store'
import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { Component, Show, createEffect } from 'solid-js'
import { fmt_datetime, httpx } from 'shared'
import {
    ArrowLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ImageIcon,
    PlusIcon,
} from 'icons'

export default () => {
    type State = {
        blogs: BlogModel[]
        page: number
    }

    const [params, setParams] = useSearchParams()
    const [state, setState] = createStore<State>({
        blogs: [],
        page: parseInt(params.page) || 0,
    })

    const { pid } = useParams()
    const nav = useNavigate()

    createEffect(() => {
        blog_list(state.page)
        setParams({ page: state.page })
    })

    function blog_list(page: number) {
        httpx({
            url: `/api/projects/${pid}/blogs/`,
            method: 'GET',
            params: { page },
            exclude_status: [404],
            onLoad(x) {
                if (x.status == 404) return nav('/projects/')
                if (x.status != 200) return

                setState({ blogs: x.response, page })
            },
        })
    }

    function blog_add() {
        httpx({
            url: `/api/projects/${pid}/blogs/`,
            method: 'POST',
            onLoad(x) {
                if (x.status != 200) return
                blog_list(0)
            },
        })
    }

    return (
        <div class='blogs-fnd'>
            <div class='actions'>
                <div>
                    <button
                        class='styled icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav('/projects/' + pid)}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
                <div>
                    <button
                        class='styled icon'
                        disabled={state.page < 1}
                        onClick={() => blog_list(state.page - 1)}
                    >
                        <ChevronLeftIcon />
                    </button>
                    <button
                        class='styled icon'
                        style={{ '--color': 'var(--green)' }}
                        onClick={blog_add}
                    >
                        <PlusIcon />
                    </button>
                    <button
                        class='styled icon'
                        disabled={state.blogs.length < 32}
                        onClick={() => blog_list(state.page + 1)}
                    >
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>
            <div class='blog-list'>
                {state.blogs.map(b => (
                    <Blog b={b} pid={pid} />
                ))}
            </div>
        </div>
    )
}

type BlogProps = {
    pid: string
    b: BlogModel
}
const Blog: Component<BlogProps> = P => {
    const nav = useNavigate()
    return (
        <div
            class='blog'
            onClick={() => nav(`/projects/${P.pid}/blogs/${P.b.id}/`)}
        >
            <div class='thumbnail'>
                <Show when={P.b.thumbnail} fallback={<ImageIcon />}>
                    <img
                        draggable={false}
                        loading='lazy'
                        decoding='async'
                        src={`/simurgh-record/bt-${P.b.id}-${P.b.thumbnail}`}
                    />
                </Show>
            </div>
            <div class='info'>
                <span>شناسه:</span>
                <span class='n'>{P.b.id}</span>
                <span>عنوان:</span>
                <span dir='auto'>{P.b.title || '---'}</span>
                <span>تاریخ شروع:</span>
                <span class='n'>{fmt_datetime(P.b.created_at)}</span>
            </div>
        </div>
    )
}
