import { createStore } from 'solid-js/store'
import './style/blog.scss'
import { BlogModel } from 'models'

export default () => {
    type State = {
        blog: BlogModel
        edit: boolean
    }
    const [state, setState] = createStore<State>({
        blog: {
            id: 0,
            slug: '',
            project: null,
            author: null,
            created_at: 0,
            updated_at: 0,
            title: '',
            detail: '',
            data: '',
            html: '',
            thumbnail: null,
            read_time: null,
        },
        edit: false,
    })

    return <div>blog page</div>
}
