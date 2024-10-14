import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import {
    ArrowLeftIcon,
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    IdIcon,
    ImageIcon,
} from 'icons'
import { BlogModel } from 'models'
import { fmt_datetime, httpx } from 'shared'
import { Component, createEffect, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import './style/blogs.scss'

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
                        class='  go-back icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav('/projects/' + pid)}
                    >
                        <ArrowLeftIcon size={25} />
                    </button>
                </div>
            </div>
            <div class='blog-list'>
                <button class='new-blog title_small' onclick={blog_add}>
                    بلاگ جدید
                </button>
                <div class='blog-wrapper'>
                    {state.blogs.map(b => (
                        <Blog b={b} pid={pid} />
                    ))}
                </div>
            </div>
            <div class='pages'>
                <button
                    class='icon'
                    onClick={() => blog_list(state.page - 1)}
                    classList={{ disable: state.blogs.length < 31 }}
                    disabled={state.page == 0}
                >
                    <ChevronLeftIcon size={30} />
                </button>
                <button
                    class='icon'
                    classList={{ disable: state.blogs.length < 31 }}
                    onClick={() => blog_list(state.page + 1)}
                    disabled={state.blogs.length < 31}
                >
                    <ChevronRightIcon size={30} />
                </button>
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
            classList={{ draft: P.b.status === 'draft' }}
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
            <h1 class='title_smaller blog-title'>{P.b.title || '---'}</h1>
            <p class='description blog-desc'>{P.b.detail}</p>
            <div class='bottom-infos title_smaller'>
                <div class='bottom-info'>
                    <div class='holder'>
                        <IdIcon />
                    </div>
                    <div class='data number'>{P.b.id}</div>
                </div>
                <div class='bottom-info'>
                    <div class='holder'>
                        <CalendarIcon />
                    </div>
                    <div class='data'>
                        {fmt_datetime(P.b.created_at).split(' ')[0]}
                    </div>
                </div>
            </div>
        </div>
    )
}
