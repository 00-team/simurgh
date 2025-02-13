import { useNavigate, useParams } from '@solidjs/router'
import {
    ArrowLeftIcon,
    ArrowUpLeftIcon,
    CalculatorIcon,
    ImageIcon,
    RotateCcwIcon,
    SaveIcon,
    TextCursorIcon,
    TrashIcon,
    WrenchIcon,
    XIcon,
} from 'icons'
import { BlogModel, DEFAULT_BLOG } from 'models'
import { createEffect, createMemo, on, Show } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

import { addAlert } from 'comps'
import { fmt_date_input, fmt_datetime, fmt_hms, httpx } from 'shared'
import { setPopup } from 'store/popup'
import './style/blog.scss'
import { setSelf } from 'store'

const WORD_PRE_SECONDS = 2.69

export default () => {
    type State = {
        blog: BlogModel
        editing: boolean
        edit: Pick<
            BlogModel,
            'detail' | 'read_time' | 'slug' | 'status' | 'title' | 'publish_at'
        >
    }
    const [state, setState] = createStore<State>({
        blog: DEFAULT_BLOG,
        editing: false,
        edit: {
            slug: '',
            status: 'draft',
            title: '',
            detail: '',
            publish_at: null,
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
                        s.edit.publish_at = s.blog.publish_at
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
            state.blog.read_time != state.edit.read_time ||
            state.blog.publish_at != state.edit.publish_at
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
                s.edit.publish_at = s.blog.publish_at
            })
        )
    }

    function blog_thumbnail_update() {
        if (!state.blog.id) return

        let el = document.createElement('input')
        el.setAttribute('type', 'file')
        el.setAttribute('accept', 'image/*')
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

    function calculate_read_time() {
        let total_words = 0
        for (let block of state.blog.data) {
            if (block.kind == 'text') {
                for (let g of block.groups) {
                    for (let line of g.content) {
                        total_words += line.trim().split(/\s+/).length
                    }
                }
            } else if (block.kind == 'heading') {
                total_words += block.content.trim().split(/\s+/).length
            }
        }
        setState(
            produce(s => {
                s.edit.read_time = ~~(total_words / WORD_PRE_SECONDS)
                // s.edit.read_time = total_words
            })
        )
    }

    const STATUS_DPY: { [k in BlogModel['status']]: [string, string] } = {
        draft: ['پیش نویس', 'var(--yellow)'],
        published: ['منتشر شده', 'var(--green)'],
    }

    return (
        <div class='blog-fnd'>
            <div class='actions'>
                <div class='ctas'>
                    <button
                        class='go-back icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav(`/projects/${pid}/`)}
                    >
                        <ArrowUpLeftIcon />
                    </button>
                    <button
                        class='go-back icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav(`/projects/${pid}/blogs/`)}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
                <div class='ctas'>
                    <Show when={!state.editing}>
                        <button
                            class='cta title_smaller editor'
                            classList={{ active: state.editing }}
                            onClick={() =>
                                nav(
                                    `/projects/${pid}/blogs/${state.blog.id}/editor/`
                                )
                            }
                        >
                            باز کردن ادیتور
                            <TextCursorIcon />
                        </button>
                        <button
                            class='cta title_smaller edit'
                            classList={{ active: state.editing }}
                            onClick={() => {
                                setState({ editing: true })
                            }}
                        >
                            ویرایش مقاله
                            <WrenchIcon />
                        </button>
                        <button
                            class='cta title_smaller delete '
                            classList={{ active: state.editing }}
                            onClick={() =>
                                setPopup({
                                    show: true,
                                    content: 'از حذف مقاله مطمعنید؟',
                                    Icon: TrashIcon,
                                    onSubmit: () => blog_delete(),
                                    type: 'error',
                                    title: 'حذف مقاله',
                                })
                            }
                        >
                            حذف مقاله
                            <TrashIcon />
                        </button>
                    </Show>
                    <Show when={state.editing}>
                        <button
                            class='cta title_smaller delete'
                            onClick={() => {
                                if (changed())
                                    return setPopup({
                                        show: true,
                                        type: 'warning',
                                        title: 'دذخیره نکردید!',
                                        content: 'از بستن بدون ذخیره مطمعنید؟',
                                        Icon: RotateCcwIcon,
                                        onSubmit: () => {
                                            reset()
                                            setState(
                                                produce(
                                                    s => (s.editing = false)
                                                )
                                            )
                                        },
                                    })
                                setState(produce(s => (s.editing = false)))
                            }}
                        >
                            بستن
                            <XIcon />
                        </button>
                        <button
                            class='cta title_smaller save'
                            classList={{ disable: !changed() }}
                            onClick={() => {
                                if (!changed())
                                    return addAlert({
                                        type: 'error',
                                        subject: ' خطا!',
                                        content: 'مطلبی رو عوض نکردید!',
                                        timeout: 300,
                                    })

                                blog_update()
                            }}
                        >
                            ذخیره
                            <SaveIcon />
                        </button>
                    </Show>
                </div>
            </div>
            <div class='blog-body'>
                <div class='info title_small'>
                    <div class='row'>
                        <span>شناسه:</span>
                        <span class='n'>{state.blog.id}</span>
                    </div>
                    <div class='row'>
                        <span>نشانه:</span>
                        <Show
                            when={state.editing}
                            fallback={<span dir='auto'>{state.blog.slug}</span>}
                        >
                            <input
                                maxLength={255}
                                dir='auto'
                                value={state.edit.slug}
                                class='styled title_small'
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
                    </div>
                    <div class='row'>
                        <span>وضعیت:</span>
                        <Show
                            when={state.editing}
                            fallback={
                                <div dir='auto'>
                                    {STATUS_DPY[state.blog.status][0]}
                                </div>
                            }
                        >
                            <button
                                class='styled title_smaller'
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
                    </div>

                    <Show when={state.edit.status === 'draft'}>
                        <div class='row'>
                            <span>منتشر در تاریخ:</span>
                            <input
                                type='date'
                                value={
                                    state.edit.publish_at &&
                                    fmt_date_input(
                                        new Date(state.edit.publish_at * 1e3)
                                    )
                                }
                                min={fmt_date_input(new Date())}
                                onChange={e => {
                                    let v = e.currentTarget.value
                                    let t = new Date(v).getTime() / 1e3
                                    setState(produce(s => (s.edit.publish_at = t)))
                                }}
                            />
                            <button
                                onClick={() => {
                                    setState(
                                        produce(s => (s.edit.publish_at = null))
                                    )
                                }}
                            >
                                X
                            </button>
                        </div>
                    </Show>


                    <div class='row'>
                        <span>عنوان:</span>
                        <Show
                            when={state.editing}
                            fallback={
                                <span class='project-name' dir='auto'>
                                    {state.blog.title || '---'}
                                </span>
                            }
                        >
                            <input
                                maxLength={255}
                                dir='auto'
                                value={state.edit.title}
                                class='styled title_small'
                                placeholder='عنوان...'
                                onInput={e =>
                                    setState(
                                        produce(s => {
                                            s.edit.title = e.currentTarget.value
                                        })
                                    )
                                }
                            />
                        </Show>
                    </div>

                    <div class='row'>
                        <span>توصیف:</span>
                        <Show
                            when={state.editing}
                            fallback={
                                <p
                                    class='project-desc title_smaller'
                                    dir='auto'
                                >
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
                                class=' title_smaller'
                                placeholder='توصیف'
                                value={state.edit.detail}
                                rows={
                                    state.edit.detail.split('\n').length + 1 <
                                    10
                                        ? 10
                                        : state.edit.detail.split('\n').length +
                                          1
                                }
                                maxLength={2047}
                                cols={50}
                                onInput={e => {
                                    setState(
                                        produce(s => {
                                            s.edit.detail =
                                                e.currentTarget.value
                                        })
                                    )
                                }}
                            ></textarea>
                        </Show>
                    </div>

                    <div class='row'>
                        <span>زمان مطالعه:</span>
                        <Show
                            when={state.editing}
                            fallback={
                                <div class='read-time'>
                                    {fmt_hms(state.blog.read_time)}
                                </div>
                            }
                        >
                            <div class='read-time-input'>
                                <input
                                    class='styled title_small'
                                    type='number'
                                    inputMode='numeric'
                                    value={state.edit.read_time}
                                    onInput={e => {
                                        setState(
                                            produce(s => {
                                                s.edit.read_time =
                                                    parseInt(
                                                        e.currentTarget.value
                                                    ) || 0
                                            })
                                        )
                                    }}
                                />
                                <button
                                    class='styled icon'
                                    onclick={calculate_read_time}
                                >
                                    <CalculatorIcon />
                                </button>
                            </div>
                        </Show>
                    </div>

                    <div class='row'>
                        <span>تاریخ آعاز:</span>
                        <span class='n'>
                            {fmt_datetime(state.blog.created_at)}
                        </span>
                    </div>

                    <div class='row'>
                        <span>تاریخ بروزرسانی:</span>
                        <span class='n'>
                            {fmt_datetime(state.blog.updated_at)}
                        </span>
                    </div>
                    <div class='row'>
                        <Show when={!state.editing}>
                            <span>بنر:</span>
                            <div
                                class='thumbnail'
                                onClick={blog_thumbnail_update}
                            >
                                <Show
                                    when={state.blog.thumbnail}
                                    fallback={<ImageIcon />}
                                >
                                    <img
                                        draggable={false}
                                        loading='lazy'
                                        decoding='async'
                                        src={`/simurgh-record/bt-${state.blog.id}-${state.blog.thumbnail}`}
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
                </div>

                <div class='preview-container'>
                    <h2 class='section_title'>پیش نمایش مقاله</h2>
                    {preview && preview.childElementCount <= 0 && (
                        <div class='preview-default'>
                            <h4 class='title_small'>
                                پیش نمایش در اینجا میاید.
                            </h4>
                        </div>
                    )}
                    <div class='preview' ref={preview}></div>
                </div>
            </div>
        </div>
    )
}
