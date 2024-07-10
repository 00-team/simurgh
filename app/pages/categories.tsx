import { useNavigate, useParams } from '@solidjs/router'
import { ArrowLeftIcon } from 'icons'
import './style/categories.scss'

export default () => {
    const { pid } = useParams()
    const nav = useNavigate()

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
                    <tbody class='title_smaller'>
                        <tr>
                            <td>1</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                        </tr>
                        <tr>
                            <td>1</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                        </tr>
                        <tr>
                            <td>1</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                        </tr>
                        <tr>
                            <td>1</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                        </tr>
                        <tr>
                            <td>1</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                            <td>d</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    )
}
