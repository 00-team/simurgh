import { Component } from 'solid-js'

import './style/projects.scss'

export const Projects: Component = () => {
    // TODO: uncomment this later
    // onMount(() => {
    //     if (!user || !user.token) return

    //     httpx({
    //         url: '/api/verification/',
    //         method: 'POST',
    //         type: 'json',
    //         headers: {
    //             authorization: user.token,
    //         },
    //         onLoad(x) {
    //             console.log(x)
    //         },
    //     })
    // })

    // type ProjectModel = {
    //     project_id: number
    //     title: string
    //     description: string
    //     features: string[]
    //     sector: string
    //     latitude: number
    //     longitude: number
    //     payment_terms: string
    //     prices: PriceModel[]
    //     images: ImagesModel
    // }

    return (
        <section class='projects'>
            <header class='section_title'>projects</header>
            <div class='projects-wrapper'>
                <div class='project-card'>
                    <h3 class='title'>lorem ipsum</h3>
                </div>
            </div>
        </section>
    )
}
