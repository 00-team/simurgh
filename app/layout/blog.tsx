import { createStore, produce } from 'solid-js/store'
import { BlogModel } from 'models'
import { useNavigate, useParams } from '@solidjs/router'
import {
    ArrowLeftIcon,
    ArrowUpLeftIcon,
    ImageIcon,
    RotateCcwIcon,
    SaveIcon,
    TextCursorIcon,
    TrashIcon,
    WrenchIcon,
    XIcon,
} from 'icons'
import { Show, createEffect, createMemo, on } from 'solid-js'

import './style/blog.scss'
import { fmt_datetime, fmt_hms, httpx } from 'shared'
import { Confact, addAlert } from 'comps'

export default () => {
    type State = {
        blog: BlogModel
        editing: boolean
        edit: Pick<
            BlogModel,
            'detail' | 'read_time' | 'slug' | 'status' | 'title'
        >
    }
    const [state, setState] = createStore<State>({
        blog: {
            id: 0,
            slug: '',
            status: 'draft',
            project: null,
            author: null,
            created_at: 0,
            updated_at: 0,
            title: '',
            detail: '',
            data: [],
            html: '',
            thumbnail: null,
            read_time: 0,
        },
        editing: false,
        edit: {
            slug: '',
            status: 'draft',
            title: '',
            detail: '',
            read_time: 0,
        },
    })
    const nav = useNavigate()
    const { pid, bid } = useParams()

    let preview: HTMLDivElement
    createEffect(() => {
        preview.innerHTML = state.blog.html
    })

    createEffect(
        on(
            () => {
                state.blog
            },
            () => {
                setState(
                    produce(s => {
                        s.edit.slug = s.blog.slug
                        s.edit.status = s.blog.status
                        s.edit.title = s.blog.title
                        s.edit.detail = s.blog.detail
                        s.edit.read_time = s.blog.read_time
                    })
                )
            },
            { defer: true }
        )
    )

    const changed = createMemo(
        () =>
            state.blog.slug != state.edit.slug ||
            state.blog.status != state.edit.status ||
            state.blog.title != state.edit.title ||
            state.blog.detail != state.edit.detail ||
            state.blog.read_time != state.edit.read_time
    )

    createEffect(() => {
        let id = parseInt(bid)
        if (isNaN(id)) return nav(`/projects/${pid}/blogs/`)

        httpx({
            url: `/api/projects/${pid}/blogs/${id}/`,
            method: 'GET',
            exclude_status: [404],
            onLoad(x) {
                if (x.status == 404) return nav('/projects/')
                if (x.status != 200) return
                setState({ blog: x.response })
            },
        })
    })

    function blog_delete() {
        if (!state.blog.id) return

        httpx({
            url: `/api/projects/${pid}/blogs/${state.blog.id}/`,
            method: 'DELETE',
            onLoad(x) {
                if (x.status != 200) return
                nav(`/projects/${pid}/blogs/`)
            },
        })
    }

    function blog_update() {
        if (!state.blog.id) return

        httpx({
            url: `/api/projects/${pid}/blogs/${state.blog.id}/`,
            method: 'PATCH',
            json: {
                ...state.edit,
            },
            onLoad(x) {
                if (x.status != 200) return
                setState({ blog: x.response, editing: false })
            },
        })
    }

    function reset() {
        setState(
            produce(s => {
                s.edit.slug = s.blog.slug
                s.edit.status = s.blog.status
                s.edit.title = s.blog.title
                s.edit.detail = s.blog.detail
                s.edit.read_time = s.blog.read_time
            })
        )
    }

    function blog_thumbnail_update() {
        if (!state.blog.id) return

        let el = document.createElement('input')
        el.setAttribute('type', 'file')
        el.setAttribute('accept', 'image/')
        el.onchange = () => {
            if (!el.files || !el.files[0]) return
            if (el.files[0].size > 8388608) {
                addAlert({
                    type: 'error',
                    subject: 'فایل بد',
                    content: 'حجم فایل مورد نظر شما بزرگتر از 8 مگابایت است',
                    timeout: 5,
                })
                return
            }

            let data = new FormData()
            data.set('photo', el.files[0])

            httpx({
                url: `/api/projects/${pid}/blogs/${state.blog.id}/thumbnail/`,
                method: 'PUT',
                data,
                onLoad(x) {
                    if (x.status != 200) return
                    setState({ blog: x.response })
                },
            })
        }
        el.click()
    }

    function blog_thumbnail_delete() {
        if (!state.blog.id) return

        httpx({
            url: `/api/projects/${pid}/blogs/${state.blog.id}/thumbnail/`,
            method: 'DELETE',
            onLoad(x) {
                if (x.status != 200) return
                setState({ blog: x.response })
            },
        })
    }

    const STATUS_DPY: { [k in BlogModel['status']]: [string, string] } = {
        draft: ['پیش نویس', 'var(--yellow)'],
        published: ['منتشر شده', 'var(--green)'],
    }

    return (
        <div class='blog-fnd'>
            <div class='actions'>
                <div>
                    <button
                        class='styled icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav(`/projects/${pid}/`)}
                    >
                        <ArrowUpLeftIcon />
                    </button>
                    <button
                        class='styled icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav(`/projects/${pid}/blogs/`)}
                    >
                        <ArrowLeftIcon />
                    </button>
                    <button
                        class='styled icon'
                        onClick={() =>
                            nav(
                                `/projects/${pid}/blogs/${state.blog.id}/editor/`
                            )
                        }
                    >
                        <TextCursorIcon />
                    </button>
                </div>
                <div>
                    <Show when={state.editing && changed()}>
                        <Confact
                            icon={SaveIcon}
                            onAct={blog_update}
                            timer_ms={700}
                            color='var(--green)'
                        />
                    </Show>
                    <Show when={state.editing && changed()}>
                        <Confact
                            icon={RotateCcwIcon}
                            onAct={reset}
                            timer_ms={700}
                            color='var(--blue)'
                        />
                    </Show>
                    <button
                        class='styled icon edit-btn'
                        classList={{ active: state.editing }}
                        onClick={() => setState(s => ({ editing: !s.editing }))}
                    >
                        <WrenchIcon />
                    </button>
                    <Confact
                        icon={TrashIcon}
                        onAct={blog_delete}
                        timer_ms={1500}
                        color='var(--red)'
                    />
                </div>
            </div>
            <div class='blog-body'>
                <div class='info'>
                    <span>شناسه:</span>
                    <span class='n'>{state.blog.id}</span>
                    <span>نشانه:</span>
                    <Show
                        when={state.editing}
                        fallback={<span dir='auto'>{state.blog.slug}</span>}
                    >
                        <input
                            maxLength={255}
                            dir='auto'
                            value={state.edit.slug}
                            class='styled'
                            placeholder='نشانه در لینک'
                            onInput={e =>
                                setState(
                                    produce(s => {
                                        s.edit.slug = e.currentTarget.value
                                    })
                                )
                            }
                        />
                    </Show>
                    <span>وضعیت:</span>
                    <Show
                        when={state.editing}
                        fallback={
                            <span dir='auto'>
                                {STATUS_DPY[state.blog.status][0]}
                            </span>
                        }
                    >
                        <button
                            class='styled'
                            style={{
                                '--color': STATUS_DPY[state.edit.status][1],
                            }}
                            onClick={() =>
                                setState(
                                    produce(s => {
                                        if (s.edit.status == 'draft') {
                                            s.edit.status = 'published'
                                        } else {
                                            s.edit.status = 'draft'
                                        }
                                    })
                                )
                            }
                        >
                            {STATUS_DPY[state.edit.status][0]}
                        </button>
                    </Show>

                    <span>عنوان:</span>
                    <Show
                        when={state.editing}
                        fallback={
                            <span dir='auto'>{state.blog.title || '---'}</span>
                        }
                    >
                        <input
                            maxLength={255}
                            dir='auto'
                            value={state.edit.title}
                            class='styled'
                            placeholder='عنوان'
                            onInput={e =>
                                setState(
                                    produce(s => {
                                        s.edit.title = e.currentTarget.value
                                    })
                                )
                            }
                        />
                    </Show>
                    <span>توصیف:</span>
                    <Show
                        when={state.editing}
                        fallback={
                            <p dir='auto'>
                                {state.blog.detail
                                    .split('\n')
                                    .map((l, i, a) => (
                                        <>
                                            {l}
                                            {i < a.length - 1 && <br />}
                                        </>
                                    ))}
                            </p>
                        }
                    >
                        <textarea
                            dir='auto'
                            class='styled'
                            placeholder='توصیف'
                            value={state.edit.detail}
                            rows={state.edit.detail.split('\n').length + 1}
                            maxLength={2047}
                            onInput={e => {
                                setState(
                                    produce(s => {
                                        s.edit.detail = e.currentTarget.value
                                    })
                                )
                            }}
                        ></textarea>
                    </Show>
                    <span>زمان مطالعه:</span>
                    <Show
                        when={state.editing}
                        fallback={
                            <span class='read_time'>
                                {fmt_hms(state.blog.read_time)}
                            </span>
                        }
                    >
                        <input
                            class='styled'
                            type='numer'
                            value={state.edit.read_time}
                            onInput={e => {
                                setState(
                                    produce(s => {
                                        s.edit.read_time =
                                            parseInt(e.currentTarget.value) || 0
                                    })
                                )
                            }}
                        />
                    </Show>
                    <span>تاریخ آعاز:</span>
                    <span class='n'>{fmt_datetime(state.blog.created_at)}</span>
                    <span>تاریخ بروزرسانی:</span>
                    <span class='n'>{fmt_datetime(state.blog.updated_at)}</span>
                    <Show when={!state.editing}>
                        <span>بنر:</span>
                        <div class='thumbnail' onClick={blog_thumbnail_update}>
                            <Show
                                when={state.blog.thumbnail}
                                fallback={<ImageIcon />}
                            >
                                <img
                                    draggable={false}
                                    loading='lazy'
                                    decoding='async'
                                    src={`/record/bt-${state.blog.id}-${state.blog.thumbnail}`}
                                />
                                <button
                                    class='del-btn styled icon'
                                    onClick={e => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        blog_thumbnail_delete()
                                    }}
                                >
                                    <XIcon />
                                </button>
                            </Show>
                        </div>
                    </Show>
                </div>
                <div class='preview' ref={preview} />
            </div>
        </div>
    )
}
