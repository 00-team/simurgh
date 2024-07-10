import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { addAlert } from 'comps'
import { ArrowLeftIcon, PencilIcon, PlusIcon, TrashIcon } from 'icons'
import { BlogCategory } from 'models'
import { httpx } from 'shared'
import { Component, createEffect, createSignal } from 'solid-js'
import { createStore, produce, SetStoreFunction } from 'solid-js/store'
import { setPopup } from 'store/popup'
import './style/categories.scss'

type State = {
    categories: BlogCategory[]
    page: number
}

export default () => {
    const { pid } = useParams()
    const nav = useNavigate()
    const [params, setParams] = useSearchParams()

    const [state, setState] = createStore<State>({
        categories: [],
        page: parseInt(params.page) || 0,
    })

    createEffect(() => {
        category_list(state.page)
        setParams({ page: state.page })
    })

    function category_list(page: number) {
        httpx({
            url: `/api/projects/${pid}/blog-categories/`,
            method: 'GET',
            params: { page },
            onLoad(x) {
                if (x.status != 200) return

                setState({ categories: x.response, page })
            },
        })
    }

    function add_category() {
        httpx({
            url: `/api/projects/${pid}/blog-categories/`,
            method: 'POST',
            params: { pid },
            onLoad(x) {
                if (x.status != 200) return

                addAlert({
                    type: 'success',
                    content: 'دسته بندی شما با موفقیت اضافه شد',
                    subject: 'موفق!',
                    timeout: 3,
                })

                setState(
                    produce(s => {
                        s.categories = [...s.categories, x.response]
                    })
                )
            },
        })
    }

    return (
        <section class='categories'>
            <div class='actions'>
                <div class='ctas'>
                    <button
                        class='go-back icon'
                        onClick={() => nav('/projects/' + pid)}
                    >
                        <ArrowLeftIcon size={25} />
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
    category: BlogCategory
    setState: SetStoreFunction<State>
}
const Category: Component<CategoryProps> = P => {
    const [editable, seteditable] = createSignal(false)
    const { pid } = useParams()

    function delete_category(category_id: number) {
        httpx({
            url: `/api/projects/${pid}/blog-categories/${category_id}/`,
            method: 'DELETE',
            params: { pid, bcid: category_id },
            onLoad(x) {
                if (x.status != 200) return

                addAlert({
                    type: 'success',
                    content: 'دسته بندی شما با موفقیت حذف شد',
                    subject: 'موفق!',
                    timeout: 3,
                })

                P.setState(
                    produce(s => {
                        s.categories = s.categories.filter(
                            s => s.id !== category_id
                        )
                    })
                )
            },
        })
    }

    return (
        <>
            {editable() ? (
                <></>
            ) : (
                <tr>
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
                        <button class='edit icon'>
                            <PencilIcon />
                        </button>
                    </td>
                </tr>
            )}
        </>
    )
}
