import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { addAlert } from 'comps'
import { ArrowLeftIcon, PencilIcon, PlusIcon, SaveIcon, TrashIcon } from 'icons'
import { BlogTag } from 'models'
import { httpx } from 'shared'
import { Component, createEffect } from 'solid-js'
import { createStore, produce, SetStoreFunction } from 'solid-js/store'
import { setPopup } from 'store/popup'
import './style/tags.scss'

type State = {
    tags: BlogTag[]
    page: number
}

export default () => {
    const { pid } = useParams()
    const nav = useNavigate()
    const [params, setParams] = useSearchParams()

    const [state, setState] = createStore<State>({
        tags: [],
        page: parseInt(params.page) || 0,
    })

    createEffect(() => {
        tag_list(state.page)
        setParams({ page: state.page })
    })

    function tag_list(page: number) {
        httpx({
            url: `/api/projects/${pid}/blog-tags/`,
            method: 'GET',
            params: { page },
            onLoad(x) {
                if (x.status != 200) return

                setState({ tags: x.response, page })
            },
        })
    }

    function add_tag() {
        httpx({
            url: `/api/projects/${pid}/blog-tags/`,
            method: 'POST',
            params: { pid },
            onLoad(x) {
                if (x.status != 200) return

                addAlert({
                    type: 'success',
                    content: 'تگ شما با موفقیت اضافه شد',
                    subject: 'موفق!',
                    timeout: 3,
                })

                setState(
                    produce(s => {
                        s.tags = [...s.tags, x.response]
                    })
                )
            },
        })
    }

    return (
        <section class='tags'>
            <div class='actions'>
                <div class='ctas'>
                    <button
                        class='go-back icon'
                        onClick={() => nav('/projects/' + pid)}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
                <div class='ctas'>
                    <button class='cta title_smaller add' onClick={add_tag}>
                        <div class='holder'> تگ جدید </div>
                        <div class='icon'>
                            <PlusIcon />
                        </div>
                    </button>
                </div>
            </div>
            <div class='tags-wrapper'>
                <h3 class='section_title'> تگ های مقاله</h3>
                <table>
                    <thead class='title_smaller'>
                        <tr>
                            <th class='id'>شماره</th>
                            <th class='slug'>نشانه</th>
                            <th class='label'>نام</th>
                            <th class='detail'>توضیح </th>
                            <th class='project'>پروژه</th>
                            <th class='count'>تعداد استفاده</th>
                            <th class='config'></th>
                        </tr>
                    </thead>
                    <tbody
                        class='title_smaller'
                        classList={{ empty: state.tags.length <= 0 }}
                    >
                        {state.tags.length >= 1 ? (
                            <>
                                {state.tags.map(tag => {
                                    return <Tag setState={setState} tag={tag} />
                                })}
                            </>
                        ) : (
                            <tr class='empty'></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

interface TagProps {
    tag: BlogTag
    setState: SetStoreFunction<State>
}
const Tag: Component<TagProps> = P => {
    const [editable, seteditable] = createStore({
        editable: false,
        detail: '',
        label: '',
        slug: '',
    })

    const { pid } = useParams()

    function delete_tag(tag_id: number) {
        httpx({
            url: `/api/projects/${pid}/blog-tags/${tag_id}/`,
            method: 'DELETE',
            params: { pid, btid: tag_id },
            onLoad(x) {
                if (x.status != 200) return

                addAlert({
                    type: 'success',
                    content: 'نگ شما با موفقیت حذف شد',
                    subject: 'موفق!',
                    timeout: 3,
                })

                P.setState(
                    produce(s => {
                        s.tags = s.tags.filter(s => s.id !== tag_id)
                    })
                )
            },
        })
    }

    function update_tag(tag_id: number) {
        httpx({
            url: `/api/projects/${pid}/blog-tags/${tag_id}/`,
            method: 'PATCH',
            params: { pid, btid: tag_id },
            json: {
                detail: editable.detail,
                label: editable.label,
                slug: editable.slug,
            },
            onLoad(x) {
                if (x.status != 200) return

                addAlert({
                    type: 'success',
                    content: 'نگ شما با موفقیت به روز شد',
                    subject: 'موفق!',
                    timeout: 3,
                })

                P.setState(
                    produce(s => {
                        let TagIndex = s.tags.findIndex(c => c.id == tag_id)

                        if (TagIndex === -1) return

                        s.tags[TagIndex] = x.response
                    })
                )
            },
        })
    }

    return (
        <>
            {editable.editable ? (
                <>
                    <tr classList={{ active: editable.editable }}>
                        <td>{P.tag.id}</td>
                        <td>
                            {/* {P.category.slug} */}
                            <input
                                type='text'
                                class='inp title_smaller'
                                placeholder='نشانه نگ...'
                                value={editable.slug}
                                onchange={e =>
                                    seteditable(
                                        produce(s => (s.slug = e.target.value))
                                    )
                                }
                            />
                        </td>
                        <td>
                            <input
                                type='text'
                                class='inp title_smaller'
                                placeholder='اسم نگ...'
                                value={editable.label}
                                onchange={e =>
                                    seteditable(
                                        produce(s => (s.label = e.target.value))
                                    )
                                }
                            />
                        </td>
                        <td class='description'>
                            <input
                                type='text'
                                class='inp description'
                                placeholder='توضیح نگ...'
                                value={editable.detail}
                                onchange={e =>
                                    seteditable(
                                        produce(
                                            s => (s.detail = e.target.value)
                                        )
                                    )
                                }
                            />
                        </td>
                        <td>{P.tag.project}</td>
                        <td>{P.tag.count}</td>
                        <td class='edit'>
                            <button class='dlt icon'>
                                <TrashIcon />
                            </button>
                            <button
                                class='save icon'
                                onclick={() => update_tag(P.tag.id)}
                            >
                                <SaveIcon />
                            </button>
                        </td>
                    </tr>
                </>
            ) : (
                <tr classList={{ active: editable.editable }}>
                    <td>{P.tag.id}</td>
                    <td>{P.tag.slug}</td>
                    <td>{P.tag.label || 'بی نام'}</td>
                    <td class='description'>{P.tag.detail || 'بدون توضیح'}</td>
                    <td>{P.tag.project}</td>
                    <td>{P.tag.count}</td>
                    <td class='edit'>
                        <button
                            class='dlt icon'
                            onclick={() =>
                                setPopup({
                                    show: true,
                                    content: 'از حذف تگ مطمعنید؟',
                                    Icon: TrashIcon,
                                    title: 'حذف تگ ',
                                    type: 'error',
                                    onSubmit: () => delete_tag(P.tag.id),
                                })
                            }
                        >
                            <TrashIcon />
                        </button>
                        <button
                            class='edit icon'
                            onclick={() => {
                                seteditable(
                                    produce(s => {
                                        s.editable = true
                                        s.label = P.tag.label
                                        s.slug = P.tag.slug
                                        s.detail = P.tag.detail
                                    })
                                )
                            }}
                        >
                            <PencilIcon />
                        </button>
                    </td>
                </tr>
            )}
        </>
    )
}
