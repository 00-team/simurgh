import { useParams } from '@solidjs/router'
import { Component } from 'solid-js'

import './style/project.scss'

export const Project: Component = ({}) => {
    const param = useParams<{ id: string }>()

    return <section class='project-container'>{param.id}</section>
}
