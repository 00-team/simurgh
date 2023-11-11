import {
    AreaIcon,
    CalenderIcon,
    LocationIcon,
    PcIcon,
    QrCodeIcon,
} from '!/icons/dashboard'
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

        console.log(newDate)

        return newDate
    }

    createEffect(() => {
        console.log(projects())
    })

    // project_id: number
    // creator: number
    // name: string
    // storage: string
    // blogs: string
    // records: number
    // created_at: number
    // edited_at: number
    // api_key: string | null

    return (
        <section class='projects'>
            <header class='section_title'>projects</header>
            <div class='projects-wrapper'>
                <Link href='/project/1' class='project-card'>
                    <img
                        class='project-img'
                        src='https://picsum.photos/500/500'
                        alt=''
                    />
                    <h3 class='title'>lorem ipsum</h3>
                    <div class='project-data'>
                        <div class='row '>
                            <p class='holder title_smaller'>
                                <QrCodeIcon size={23} />
                                code
                            </p>
                            <p class='data title_small'>1</p>
                        </div>
                        <div class='row '>
                            <p class='holder title_smaller'>
                                <CalenderIcon size={23} />
                                Created At
                            </p>
                            <p class='data title_small'>
                                {numberToDate(1699694646)}
                            </p>
                        </div>

                        <div class='row '>
                            <p class='holder title_smaller'>
                                <ImageIcon size={23} />
                                images
                            </p>
                            <p class='data title_small'>1</p>
                        </div>
                        <div class='row '>
                            <p class='holder title_smaller'>
                                <PcIcon size={23} />
                                Space Taken
                            </p>
                            <p class='data title_smaller'>عباس اباد</p>
                        </div>
                    </div>
                </Link>
            </div>
        </section>
    )
}
