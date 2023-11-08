import { Component } from 'solid-js'

import './style/projects.scss'

export const Projects: Component = () => {
    return (
        <section class='projects'>
            <header class='section_title'>projects</header>
            <div class='projects-wrapper'>
                <div class='project-card'></div>
                <div class='project-card'></div>
                <div class='project-card'></div>
                <div class='project-card'></div>
                <div class='project-card'></div>
            </div>
        </section>
    )
}
