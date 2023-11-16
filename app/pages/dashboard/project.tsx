import { useParams } from '@solidjs/router'
import { Component } from 'solid-js'

import './style/project.scss'

export const Project: Component = ({}) => {
    const param = useParams<{ id: string }>()

    return (
        <section class='project-container'>
            <div class='project-wrapper'>
                <svg
                    preserveAspectRatio='none'
                    viewBox='0 0 179.40504 120.05453'
                    version='1.1'
                    id='svg1'
                    xmlns='http://www.w3.org/2000/svg'
                    width='300'
                    height='300'
                >
                    <g id='layer1' transform='translate(-13.374746,-84.437063)'>
                        <path
                            style=''
                            d='M 32.023897,86.914893 15.770745,103.16805 v 84.29969 l 14.627837,14.62784 H 177.21874 L 190.3838,188.93052 V 102.51791 L 174.69951,86.833628 Z'
                            id='path7'
                        />
                    </g>
                </svg>

                <article class='project-data'>
                    <header class='title_hero'>lorem ipsum</header>
                </article>
            </div>
        </section>
    )
}
