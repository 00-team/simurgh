import { CalenderIcon, PcIcon, QrCodeIcon } from '!/icons/dashboard'
import { ImageIcon } from '!/icons/editor'
import { httpx } from '!/shared'
import { ProjectModel } from '!/types'
import { Link } from '@solidjs/router'
import { Component, createEffect, createSignal, onMount } from 'solid-js'

import './style/projects.scss'

export const Projects: Component = () => {
    const [projects, setProjects] = createSignal<ProjectModel[]>([])

    onMount(() => {
        httpx({
            url: '/api/projects/',
            method: 'GET',
            type: 'json',
            onLoad(x) {
                if (x.status === 200) return setProjects(x.response)
            },
        })
    })

    function numberToDate(date: number) {
        let dateToMilisec = date * 1000
        let Dateoffset = new Date().getTimezoneOffset()

        let newDate = new Date(
            dateToMilisec + Dateoffset * -60
        ).toLocaleDateString('fa')

        return newDate
    }

    return (
        <section class='projects'>
            <header class='section_title'>projects</header>
            <div class='projects-wrapper'>
                {projects().map(
                    ({ name, project_id, created_at, storage, records }) => {
                        return (
                            <Link
                                href={`/project/${project_id}`}
                                class='project-card'
                            >
                                <img
                                    class='project-img'
                                    src='https://picsum.photos/500/500'
                                    alt=''
                                />
                                <h3 class='title'>{name}</h3>
                                <div class='project-data'>
                                    <div class='row '>
                                        <p class='holder title_smaller'>
                                            <QrCodeIcon size={22} />
                                            code
                                        </p>
                                        <p class='data title_small'>
                                            {project_id}
                                        </p>
                                    </div>
                                    <div class='row '>
                                        <p class='holder title_smaller'>
                                            <CalenderIcon size={22} />
                                            Created At
                                        </p>
                                        <p class='data title_small'>
                                            {numberToDate(created_at)}
                                        </p>
                                    </div>

                                    <div class='row '>
                                        <p class='holder title_smaller'>
                                            <ImageIcon size={23} />
                                            images
                                        </p>
                                        <p class='data title_small'>
                                            {records}
                                        </p>
                                    </div>
                                    <div class='row '>
                                        <p class='holder title_smaller'>
                                            <PcIcon size={23} />
                                            Space Taken
                                        </p>
                                        <p class='data title_small'>
                                            {storage}{' '}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )
                    }
                )}
            </div>
        </section>
    )
}
