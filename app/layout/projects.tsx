import { useParams } from '@solidjs/router'
import './style/projects.scss'
import { Project } from 'models'
import { createStore } from 'solid-js/store'

export default () => {
    type State = {
        page: number
        projects: Project[]
    }
    const [state, setState] = createStore<State>({ page: 0, projects: [] })
    const UP = useParams()

    return (
        <div class='projects-fnd'>
            <div class='actions'>
                <button class='styled'>پروژه جدید</button>
            </div>
            <div class='project-list'>Page: {state.page}</div>
        </div>
    )
}
