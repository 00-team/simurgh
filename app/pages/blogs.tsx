import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import {
    ArrowLeftIcon,
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    IdIcon,
    ImageIcon,
} from 'icons'

import { fmt_datetime } from 'shared'
import { Component, createEffect, createMemo, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import './style/blogs.scss'

import * as a from 'abi'

export default () => {
    type State = {
        blogs: a.Blog[]
        page: number
    }

    const [search, setParams] = useSearchParams()
    const [state, setState] = createStore<State>({
        blogs: [],
        page: parseInt(search.page || '0') || 0,
    })

    const params = useParams()
    const pidm = createMemo(() => Number(params.pid))
    const nav = useNavigate()

    createEffect(() => {
        blog_list(state.page)
        setParams({ page: state.page })
    })

    async function blog_list(page: number) {
        let r = await a.api_projects_blogs_list(
            { pid: pidm(), page },
            { exclude_status: [404] }
        )
        if (r.err()) return nav('/projects/')

        setState({ blogs: r.body, page })
    }

    async function blog_add() {
        let r = await a.api_projects_blogs_post({ pid: pidm() })
        if (r.err()) return

        await blog_list(0)
    }

    return (
        <div class='blogs-fnd'>
            <div class='actions'>
                <div>
                    <button
                        class='  go-back icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav('/projects/' + pidm())}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
            </div>
            <div class='blog-list'>
                <button class='new-blog title_small' onclick={blog_add}>
                    بلاگ جدید
                </button>
                <div class='blog-wrapper'>
                    {state.blogs.map(b => (
                        <Blog b={b} pid={pidm()} />
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
                    <ChevronLeftIcon />
                </button>
                <button
                    class='icon'
                    classList={{ disable: state.blogs.length < 31 }}
                    onClick={() => blog_list(state.page + 1)}
                    disabled={state.blogs.length < 31}
                >
                    <ChevronRightIcon />
                </button>
            </div>
        </div>
    )
}

type BlogProps = {
    pid: number
    b: a.Blog
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
