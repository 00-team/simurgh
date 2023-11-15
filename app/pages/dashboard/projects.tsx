import { CalenderIcon, ImageIcon, PcIcon, QrCodeIcon } from '!/icons/dashboard'
import { httpx } from '!/shared'
import { ProjectModel } from '!/types'
import { Link } from '@solidjs/router'
import { Component, createSignal, onMount } from 'solid-js'

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

    function getProjectRecord(id: number): string {
        httpx({
            url: `/api/projects/${id}/records/`,
            method: 'GET',
            type: 'json',
            onLoad(x) {
                if (x.status === 200) {
                    if (x.response.length >= 1) {
                        let url = x.response[0].url

                        let img = document.querySelector(
                            `img.project-img#img${id}`
                        ) as HTMLImageElement

                        img.src = url
                    }
                } else {
                    return
                }
            },
        })

        return ''
    }

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
                        getProjectRecord(project_id)

                        return (
                            <Link
                                href={`/project/${project_id}`}
                                class='project-card'
                            >
                                <img
                                    class='project-img'
                                    id={`img${project_id.toString()}`}
                                    src={'/static/image/dashboard/img.webp'}
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
                                            <ImageIcon size={22} />
                                            images
                                        </p>
                                        <p class='data title_small'>
                                            {records}
                                        </p>
                                    </div>
                                    <div class='row byte'>
                                        <p class='holder title_smaller'>
                                            <PcIcon size={23} />
                                            Space Taken
                                        </p>
                                        <p class='data title_small'>
                                            {Math.floor(+storage / 1024)}{' '}
                                            <span>kb</span>
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
