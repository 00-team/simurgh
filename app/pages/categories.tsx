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
                        class='  go-back icon'
                        onClick={() => nav('/projects/' + pid)}
                    >
                        <ArrowLeftIcon size={25} />
                    </button>
                </div>
            </div>
        </section>
    )
}
