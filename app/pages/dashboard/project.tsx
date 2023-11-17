import { Typing } from '!/components/typing'
import { useParams } from '@solidjs/router'
import { Component } from 'solid-js'

import './style/project.scss'

export const Project: Component = ({}) => {
    const param = useParams<{ id: string }>()

    return (
        <section class='project-container'>
            <div class='project-wrapper'>
                <BgSvg />
                <article class='project-data'>
                    <header class='title_hero'>
                        <Typing
                            sentence='lorem ipsum'
                            delay={2000}
                            speed={100}
                        />
                    </header>
                    <div class='project-details'>
                        <div class='details title'>
                            <DetailRow holder='creator' data='abbas taghavi' />
                            <DetailRow holder='storage' data='abbas taghavi' />
                            <DetailRow holder='blogs' data='abbas taghavi' />
                            <DetailRow holder='records' data='abbas taghavi' />
                            <DetailRow
                                holder='created at'
                                data='abbas taghavi'
                            />
                            <DetailRow
                                holder='edited at'
                                data='abbas taghavi'
                            />
                        </div>
                        <div class='project-records'></div>
                    </div>
                </article>
            </div>
        </section>
    )
}

interface DetailRowProps {
    holder: string
    data: string
}

// project_id: number
// creator: number
// name: string
// storage: string
// blogs: string
// records: number
// created_at: number
// edited_at: number
// api_key: string | null

const DetailRow: Component<DetailRowProps> = ({ holder, data }) => {
    return (
        <div class='detail-row'>
            <div class='holder'>{holder}</div>
            <div class='data'>{data}</div>
        </div>
    )
}

const BgSvg = () => {
    return (
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
    )
}
