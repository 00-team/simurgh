import { useNavigate } from '@solidjs/router'
import { ArrowLeftIcon } from 'icons'
import './style/categories.scss'

export default () => {
    const nav = useNavigate()

    return (
        <section class='categories'>
            <div class='actions'>
                <div>
                    <button
                        class='  go-back icon'
                        onClick={() => nav('/blogs/')}
                    >
                        <ArrowLeftIcon size={25} />
                    </button>
                </div>
            </div>
        </section>
    )
}
