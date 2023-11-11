import { useParams } from '@solidjs/router'
import { Component } from 'solid-js'

import './style/project.scss'

export const Project: Component = ({}) => {
    const param = useParams<{ id: string }>()

    console.log(param.id)
    return <section class='project-container'>project</section>
}
