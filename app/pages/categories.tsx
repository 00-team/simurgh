import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { ArrowLeftIcon } from 'icons'
import { BlogCategory } from 'models'
import { httpx } from 'shared'
import { createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'
import './style/categories.scss'

export default () => {
    const { pid } = useParams()
    const nav = useNavigate()
    const [params, setParams] = useSearchParams()

    type State = {
        categories: BlogCategory[]
        page: number
    }

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
                                        <tr>
                                            <td>{C.id}</td>
                                            <td>{C.slug}</td>
                                            <td>{C.label}</td>
                                            <td>{C.detail}</td>
                                            <td>{C.project}</td>
                                            <td>{C.count}</td>
                                        </tr>
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
