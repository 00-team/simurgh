import {
    AreaIcon,
    LocationIcon,
    PriceIcon,
    QrCodeIcon,
} from '!/icons/dashboard'
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
                                <LocationIcon size={23} />
                                location
                            </p>
                            <p class='data title_smaller'>عباس اباد</p>
                        </div>
                        <div class='row '>
                            <p class='holder title_smaller'>
                                <AreaIcon size={25} />
                                area
                            </p>
                            <p class='data title_small'>1</p>
                        </div>
                        <div class='row '>
                            <p class='holder title_smaller'>
                                <PriceIcon size={25} />
                                price start
                            </p>
                            <p class='data title_small'>1</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
