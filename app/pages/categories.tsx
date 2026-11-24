import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { addAlert } from 'comps'
import { ArrowLeftIcon, PencilIcon, PlusIcon, SaveIcon, TrashIcon } from 'icons'
import { Component, createEffect, createMemo } from 'solid-js'
import { createStore, produce, SetStoreFunction } from 'solid-js/store'
import { setPopup } from 'store/popup'
import './style/categories.scss'

import * as a from 'abi'

type State = {
    categories: a.BlogCategory[]
    page: number
}

export default () => {
    const params = useParams()
    const pidm = createMemo(() => Number(params.pid))

    const nav = useNavigate()
    const [search, setParams] = useSearchParams()

    const [state, setState] = createStore<State>({
        categories: [],
        page: parseInt(search.page || '0') || 0,
    })

    createEffect(() => {
        category_list(state.page)
        setParams({ page: state.page })
    })

    async function category_list(page: number) {
        let r = await a.api_projects_blog_categories_list({ pid: pidm(), page })
        if (r.err()) return
        setState({ categories: r.body, page })
    }

    async function add_category() {
        let r = await a.api_projects_blog_categories_post({ pid: pidm() })
        if (r.err()) return

        addAlert({
            type: 'success',
            content: 'دسته بندی شما با موفقیت اضافه شد',
            subject: 'موفق!',
            timeout: 3,
        })

        setState(
            produce(s => {
                s.categories = [...s.categories, r.body]
            })
        )
    }

    return (
        <section class='categories'>
            <div class='actions'>
                <div class='ctas'>
                    <button
                        class='go-back icon'
                        onClick={() => nav('/projects/' + pidm())}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
                <div class='ctas'>
                    <button
                        class='cta title_smaller add'
                        onClick={add_category}
                    >
                        <div class='holder'>دسته بندی جدید </div>
                        <div class='icon'>
                            <PlusIcon />
                        </div>
                    </button>
                </div>
            </div>
            <div class='categories-wrapper'>
                <h3 class='section_title'>دسته بندی مقاله</h3>
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
                        classList={{ empty: state.categories.length <= 0 }}
                    >
                        {state.categories.length >= 1 ? (
                            <>
                                {state.categories.map(C => {
                                    return (
                                        <Category
                                            setState={setState}
                                            category={C}
                                            pid={pidm()}
                                        />
                                    )
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

interface CategoryProps {
    category: a.BlogCategory
    setState: SetStoreFunction<State>
    pid: number
}
const Category: Component<CategoryProps> = P => {
    const [editable, seteditable] = createStore({
        editable: false,
        detail: '',
        label: '',
        slug: '',
    })

    async function delete_category(id: number) {
        let r = await a.api_projects_blog_categories_del({
            pid: P.pid,
            bcid: id,
        })

        if (r.err()) return

        addAlert({
            type: 'success',
            content: 'دسته بندی شما با موفقیت حذف شد',
            subject: 'موفق!',
            timeout: 3,
        })

        P.setState(
            produce(s => {
                s.categories = s.categories.filter(s => s.id !== id)
            })
        )
    }

    async function update_category(id: number) {
        let r = await a.api_projects_blog_categories_patch(
            {
                pid: P.pid,
                bcid: id,
            },
            {
                detail: editable.detail,
                label: editable.label,
                slug: editable.slug,
            }
        )
        if (r.err()) return

        addAlert({
            type: 'success',
            content: 'دسته بندی شما با موفقیت به روز شد',
            subject: 'موفق!',
            timeout: 3,
        })

        P.setState(
            produce(s => {
                let idx = s.categories.findIndex(c => c.id == id)

                if (idx === -1) return

                s.categories[idx] = r.body
            })
        )
    }

    return (
        <>
            {editable.editable ? (
                <>
                    <tr classList={{ active: editable.editable }}>
                        <td>{P.category.id}</td>
                        <td>
                            {/* {P.category.slug} */}
                            <input
                                type='text'
                                class='inp title_smaller'
                                placeholder='نشانه دسته بندی...'
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
                                placeholder='اسم دسته بندی...'
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
                                placeholder='توضیح دسته بندی...'
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
                        <td>{P.category.project}</td>
                        <td>{P.category.count}</td>
                        <td class='edit'>
                            <button class='dlt icon'>
                                <TrashIcon />
                            </button>
                            <button
                                class='save icon'
                                onclick={() => update_category(P.category.id)}
                            >
                                <SaveIcon />
                            </button>
                        </td>
                    </tr>
                </>
            ) : (
                <tr classList={{ active: editable.editable }}>
                    <td>{P.category.id}</td>
                    <td>{P.category.slug}</td>
                    <td>{P.category.label || 'بی نام'}</td>
                    <td class='description'>
                        {P.category.detail || 'بدون توضیح'}
                    </td>
                    <td>{P.category.project}</td>
                    <td>{P.category.count}</td>
                    <td class='edit'>
                        <button
                            class='dlt icon'
                            onclick={() =>
                                setPopup({
                                    show: true,
                                    content: 'از حذف دسته بندی مطمعنید؟',
                                    Icon: TrashIcon,
                                    title: 'حذف دسته بندی',
                                    type: 'error',
                                    onSubmit: () =>
                                        delete_category(P.category.id),
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
                                        s.label = P.category.label
                                        s.slug = P.category.slug
                                        s.detail = P.category.detail
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
