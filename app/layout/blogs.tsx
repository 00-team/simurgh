import { BlogModel } from 'models'
import './style/blogs.scss'
import { createStore } from 'solid-js/store'
import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { Component, createEffect } from 'solid-js'
import { httpx } from 'shared'

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

    return (
        <div class='blogs-fnd'>
            <div class='blog-list'>
                {state.blogs.map(b => (
                    <Blog b={b} />
                ))}
            </div>
        </div>
    )
}

type BlogProps = {
    b: BlogModel
}
const Blog: Component<BlogProps> = P => {
    return (
        <div class='blog'>
            <div class='info'>
                <span>{P.b.id}</span>
                <span>{P.b.slug}</span>
                <span>{P.b.title}</span>
                <span>{P.b.author}</span>
                <span>{P.b.detail}</span>
                <span>{P.b.read_time}</span>
                <span>{P.b.created_at}</span>
                <span>{P.b.updated_at}</span>
            </div>
        </div>
    )
}
