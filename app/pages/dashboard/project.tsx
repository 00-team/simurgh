import { HackEffect } from '!/components/hackEffect'
import { Typing } from '!/components/typing'
import { DeleteIcon, EditIcon } from '!/icons/dashboard'
import { httpx } from '!/shared'
import { ProjectModel, ProjectRecord } from '!/types'
import { useNavigate, useParams } from '@solidjs/router'
import {
    Component,
    createEffect,
    createSignal,
    onCleanup,
    onMount,
} from 'solid-js'

import './style/project.scss'

export const Project: Component = ({}) => {
    const navigate = useNavigate()
    const param = useParams<{ id: string }>()

    const [editing, setEditing] = createSignal<boolean>(false)

    const [records, setRecords] = createSignal<ProjectRecord[] | null>(null)
    const [activeRecord, setActiverecord] = createSignal(0)

    const [project, setProject] = createSignal<ProjectModel | null>(null)

    function numberToDate(date: number) {
        let dateToMilisec = date * 1000
        let Dateoffset = new Date().getTimezoneOffset()

        let newDate = new Date(
            dateToMilisec + Dateoffset * -60
        ).toLocaleDateString('US')

        return newDate
    }
    function deleteProject() {
        httpx({
            url: `/api/projects/${param.id}/`,
            method: 'DELETE',
            onLoad(x) {
                if (x.status === 200) return navigate('/projects')
            },
        })

        return
    }

    onMount(() => {
        if (!param || !param.id) return

        httpx({
            url: `/api/projects/${param.id}/`,
            method: 'GET',
            type: 'json',
            onLoad(x) {
                if (x.status === 200) return setProject(x.response)
            },
        })
        httpx({
            url: `/api/projects/${param.id}/records/`,
            method: 'GET',
            type: 'json',
            onLoad(x) {
                if (x.status === 200) {
                    if (x.response.length >= 1) {
                        setRecords(x.response)
                    } else {
                        setRecords([])
                    }
                }
            },
        })
    })

    createEffect(() => {
        console.log(activeRecord())
    })

    return (
        <section class='project-container'>
            {project() && project().api_key && records() ? (
                <div class='project-wrapper'>
                    <BgSvg />
                    <article
                        class='project-data'
                        classList={{ editing: editing() }}
                    >
                        <header class='title_hero'>
                            <Typing
                                sentence={project().name}
                                delay={1300}
                                speed={75}
                            />
                        </header>
                        <div class='project-details'>
                            <div class='details title'>
                                <DetailRow
                                    holder='storage'
                                    data={`${project().storage.toString()} byte`}
                                    holderDelay={1200}
                                    dataDelay={2200}
                                />
                                <DetailRow
                                    holder='blogs'
                                    data={project().blogs.toString()}
                                    holderDelay={1300}
                                    dataDelay={2300}
                                />
                                <DetailRow
                                    holder='records'
                                    data={project().records.toString()}
                                    holderDelay={1400}
                                    dataDelay={2400}
                                />
                                <DetailRow
                                    holder='created at'
                                    data={numberToDate(project().created_at)}
                                    holderDelay={1500}
                                    dataDelay={2500}
                                />
                                <DetailRow
                                    holder='edited at'
                                    data={project().edited_at.toString()}
                                    holderDelay={1600}
                                    dataDelay={2600}
                                />
                            </div>
                            <div class='project-records'>
                                <div class='other-imgs'>
                                    {records().length >= 2 &&
                                        records().map((record, index) => {
                                            return (
                                                <div
                                                    class='other-img'
                                                    onclick={() => {
                                                        if (
                                                            index ===
                                                            activeRecord()
                                                        )
                                                            return
                                                        setActiverecord(index)
                                                    }}
                                                >
                                                    <img
                                                        src={record.url}
                                                        alt=''
                                                    />
                                                </div>
                                            )
                                        })}
                                </div>

                                <div class='main-img'>
                                    <img
                                        src={
                                            records()[activeRecord()]
                                                ? records()[activeRecord()].url
                                                : `https://picsum.photos/500/500`
                                        }
                                        alt=''
                                    />
                                </div>
                            </div>
                        </div>
                        <div class='project-actions'>
                            <button
                                class='delete-project title_hero basic-button'
                                onclick={() => deleteProject()}
                            >
                                <DeleteIcon />
                                DELETE
                            </button>
                            <button
                                class='edit-project title_hero basic-button'
                                onclick={() => setEditing(true)}
                            >
                                <span>
                                    <EditIcon />
                                    EDIT
                                </span>
                            </button>
                        </div>
                    </article>
                    <div class='edit' classList={{ editing: editing() }}>
                        <div class='edit-wrapper'>
                            <div class='edit-row title_hero'>
                                <div class='holder'>name :</div>
                                <div class='inp'>
                                    <input
                                        type='text'
                                        class='title_small'
                                        value={project().name}
                                    />
                                </div>
                            </div>
                        </div>
                        <div class='cta-wrapper'>
                            <button class='cta confirm title_hero'>
                                confirm
                            </button>
                            <button
                                class='cta cancle title_hero'
                                onclick={() => setEditing(false)}
                            >
                                <span>cancle</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <ProjectLoading />
            )}
        </section>
    )
}

interface DetailRowProps {
    holder: string
    holderDelay?: number
    data: string
    dataDelay?: number
}

const DetailRow: Component<DetailRowProps> = ({
    holder,
    data,
    dataDelay,
    holderDelay,
}) => {
    return (
        <div class='detail-row'>
            <div class='holder'>
                <HackEffect sentence={holder} delay={holderDelay} />
            </div>
            <div class='data'>
                <HackEffect sentence={data} delay={dataDelay} />
            </div>
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
            class='project-bg-svg'
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

const sentence = 'LOADING...'
const letters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-_=+{}|[]\\;\':"<>?,./`~'
const ProjectLoading = () => {
    const [iterator, setiterator] = createSignal(0)

    let words

    let interval
    let loopDelay

    const runLoop = () => {
        let intervalId = setInterval(() => {
            words.forEach((el: HTMLElement, index) => {
                if (index < iterator()) {
                    el.innerText = sentence[index]
                    el.style.opacity = '1'

                    if (!el.className.includes('active')) {
                        el.className += ' active '
                    }

                    return
                }

                el.style.opacity = Math.random().toString()

                return (el.innerText =
                    letters[Math.floor(Math.random() * letters.length)])
            })

            setiterator(s => (s += 1 / 3))

            if (iterator() >= words.length) {
                clearInterval(intervalId)

                setTimeout(() => {
                    words.forEach((element: HTMLElement) => {
                        let newClass = element.className.replace('active', '')

                        element.className = newClass
                    })

                    setiterator(0)
                    runLoop()
                }, 1000)
            }
        }, 20)
    }

    onMount(() => {
        words = document.querySelectorAll('.loading-word')

        if (!words) return

        runLoop()
    })
    onCleanup(() => {
        clearInterval(interval)
        clearTimeout(loopDelay)
    })
    return (
        <div class='project-loading section_title'>
            <div class='words-wrapper'>
                {'LOADING...'.split('').map((word, index) => (
                    <span class='loading-word' id={`word${index}`}>
                        {word}
                    </span>
                ))}
            </div>
        </div>
    )
}
