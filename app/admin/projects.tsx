import { SearchIcon } from '!/icons/dashboard'
import { A } from '@solidjs/router'
import { onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import './style/projects.scss'

import { DeleteIcon, EditIcon } from '!/icons/actions'
import type { ProjectModel } from 'types'

type State = {
    page: number
    query: string
    data: ProjectModel[]
}

let search_input: HTMLInputElement
export default () => {
    const [state, setState] = createStore<State>({
        page: 0,
        query: '',
        data: [],
    })

    async function fetch_projects() {
        const result = await fetch(
            `/api/admin/projects/?page=${state.page}&q=${state.query}`
        )
        setState({ data: await result.json() })
    }

    async function add_project(project: Omit<ProjectModel, 'project_id'>) {
        const result = await fetch('/api/admin/projects/', {
            method: 'POST',
            body: JSON.stringify(project),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        console.log('add project was successful: ', result.ok)
        await fetch_projects()
    }
    async function delete_project(project: ProjectModel) {
        const result = await fetch(
            `/api/admin/projects/${project.project_id}/?del_imgs=true`,
            {
                method: 'DELETE',
            }
        )
        await fetch_projects()
    }

    onMount(() => {
        fetch_projects()
    })

    return (
        <section class='projects'>
            <header class='projects-header'>
                <button
                    onClick={() => {
                        add_project({
                            prices: [
                                { layout: '1 room', area: 120, price: 10099 },
                                { layout: '2 room', area: 138, price: 6996 },
                            ],
                            images: {
                                desc: { url: '', id: 0 },
                                feat: { url: '', id: 0 },
                                term: { id: 0, url: '' },
                            },
                            title: 'new Project',
                            sector: 'some where in cyprus',
                            features: ['feature 1', 'feat 2', 'ggez'],
                            latitude: 35.244760367069,
                            longitude: 33.53814253215689,
                            description:
                                'some description that \n can be mutilline',
                            payment_terms: 'the payment_terms',
                        })
                    }}
                    class='new-project basic-button title_small'
                >
                    پروژه جدید
                </button>
                <div class='search'>
                    <button
                        class='search-btn'
                        onClick={() => {
                            setState({ query: search_input.value })
                            fetch_projects()
                        }}
                    >
                        <SearchIcon />
                    </button>

                    <input
                        ref={search_input}
                        class='title_small'
                        type='text'
                        name=''
                        id=''
                        placeholder='جستجو ...'
                        autofocus
                    />
                </div>
            </header>
            <div class='projects-wrapper'>
                {state.data.map(p => (
                    <figure class='project'>
                        <img
                            class='project-img'
                            loading='lazy'
                            decoding='async'
                            src={p.images.desc.url}
                            alt=''
                        />
                        <figcaption class='datas'>
                            <div class='data-wrapper title_smaller'>
                                <div class='holder'>
                                    <svg
                                        style='margin: 0 5px;'
                                        stroke='currentColor'
                                        fill='currentColor'
                                        stroke-width='0'
                                        viewBox='0 0 16 16'
                                        height='25'
                                        width='25'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path d='M15 .5a.5.5 0 0 0-.724-.447l-8 4A.5.5 0 0 0 6 4.5v3.14L.342 9.526A.5.5 0 0 0 0 10v5.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V14h1v1.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V.5ZM2 11h1v1H2v-1Zm2 0h1v1H4v-1Zm-1 2v1H2v-1h1Zm1 0h1v1H4v-1Zm9-10v1h-1V3h1ZM8 5h1v1H8V5Zm1 2v1H8V7h1ZM8 9h1v1H8V9Zm2 0h1v1h-1V9Zm-1 2v1H8v-1h1Zm1 0h1v1h-1v-1Zm3-2v1h-1V9h1Zm-1 2h1v1h-1v-1Zm-2-4h1v1h-1V7Zm3 0v1h-1V7h1Zm-2-2v1h-1V5h1Zm1 0h1v1h-1V5Z'></path>
                                    </svg>
                                    پروژه
                                </div>
                                <div class='data'>{p.title}</div>
                            </div>
                            <div class='data-wrapper title_smaller'>
                                <div class='holder'>
                                    <svg
                                        stroke='currentColor'
                                        fill='currentColor'
                                        stroke-width='0'
                                        viewBox='0 0 16 16'
                                        height='22'
                                        width='22'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path d='M2 2h2v2H2V2Z'></path>
                                        <path d='M6 0v6H0V0h6ZM5 1H1v4h4V1ZM4 12H2v2h2v-2Z'></path>
                                        <path d='M6 10v6H0v-6h6Zm-5 1v4h4v-4H1Zm11-9h2v2h-2V2Z'></path>
                                        <path d='M10 0v6h6V0h-6Zm5 1v4h-4V1h4ZM8 1V0h1v2H8v2H7V1h1Zm0 5V4h1v2H8ZM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8H6Zm0 0v1H2V8H1v1H0V7h3v1h3Zm10 1h-1V7h1v2Zm-1 0h-1v2h2v-1h-1V9Zm-4 0h2v1h-1v1h-1V9Zm2 3v-1h-1v1h-1v1H9v1h3v-2h1Zm0 0h3v1h-2v1h-1v-2Zm-4-1v1h1v-2H7v1h2Z'></path>
                                        <path d='M7 12h1v3h4v1H7v-4Zm9 2v2h-3v-1h2v-1h1Z'></path>
                                    </svg>
                                    کد
                                </div>
                                <div class='data'>{p.project_id}</div>
                            </div>
                            <div class='data-wrapper title_smaller'>
                                <div class='holder'>
                                    <svg
                                        stroke='currentColor'
                                        fill='currentColor'
                                        stroke-width='0'
                                        viewBox='0 0 288 512'
                                        height='22'
                                        width='22'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path d='M112 316.94v156.69l22.02 33.02c4.75 7.12 15.22 7.12 19.97 0L176 473.63V316.94c-10.39 1.92-21.06 3.06-32 3.06s-21.61-1.14-32-3.06zM144 0C64.47 0 0 64.47 0 144s64.47 144 144 144 144-64.47 144-144S223.53 0 144 0zm0 76c-37.5 0-68 30.5-68 68 0 6.62-5.38 12-12 12s-12-5.38-12-12c0-50.73 41.28-92 92-92 6.62 0 12 5.38 12 12s-5.38 12-12 12z'></path>
                                    </svg>
                                    لوکیشن
                                </div>
                                <div class='data '>{p.sector}</div>
                            </div>
                            <div class='data-wrapper title_smaller'>
                                <div class='holder'>
                                    <svg
                                        stroke='currentColor'
                                        fill='currentColor'
                                        stroke-width='0'
                                        viewBox='0 0 576 512'
                                        height='22'
                                        width='22'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path d='M253.3 35.1c6.1-11.8 1.5-26.3-10.2-32.4s-26.3-1.5-32.4 10.2L117.6 192H32c-17.7 0-32 14.3-32 32s14.3 32 32 32L83.9 463.5C91 492 116.6 512 146 512H430c29.4 0 55-20 62.1-48.5L544 256c17.7 0 32-14.3 32-32s-14.3-32-32-32H458.4L365.3 12.9C359.2 1.2 344.7-3.4 332.9 2.7s-16.3 20.6-10.2 32.4L404.3 192H171.7L253.3 35.1zM192 304v96c0 8.8-7.2 16-16 16s-16-7.2-16-16V304c0-8.8 7.2-16 16-16s16 7.2 16 16zm96-16c8.8 0 16 7.2 16 16v96c0 8.8-7.2 16-16 16s-16-7.2-16-16V304c0-8.8 7.2-16 16-16zm128 16v96c0 8.8-7.2 16-16 16s-16-7.2-16-16V304c0-8.8 7.2-16 16-16s16 7.2 16 16z'></path>
                                    </svg>
                                    شروع قیمت
                                </div>
                                <div class='data '>
                                    {p.prices.length
                                        ? p.prices[0].price
                                        : 'نامعلوم'}
                                </div>
                            </div>
                            <div class='data-wrapper title_smaller'>
                                <div class='holder'>
                                    <svg
                                        stroke='currentColor'
                                        fill='currentColor'
                                        stroke-width='0'
                                        viewBox='0 0 512 512'
                                        height='1em'
                                        width='1em'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path d='M469.3 19.3l23.4 23.4c25 25 25 65.5 0 90.5l-56.4 56.4L322.3 75.7l56.4-56.4c25-25 65.5-25 90.5 0zM44.9 353.2L299.7 98.3 413.7 212.3 158.8 467.1c-6.7 6.7-15.1 11.6-24.2 14.2l-104 29.7c-8.4 2.4-17.4 .1-23.6-6.1s-8.5-15.2-6.1-23.6l29.7-104c2.6-9.2 7.5-17.5 14.2-24.2zM249.4 103.4L103.4 249.4 16 161.9c-18.7-18.7-18.7-49.1 0-67.9L94.1 16c18.7-18.7 49.1-18.7 67.9 0l19.8 19.8c-.3 .3-.7 .6-1 .9l-64 64c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0l64-64c.3-.3 .6-.7 .9-1l45.1 45.1zM408.6 262.6l45.1 45.1c-.3 .3-.7 .6-1 .9l-64 64c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0l64-64c.3-.3 .6-.7 .9-1L496 350.1c18.7 18.7 18.7 49.1 0 67.9L417.9 496c-18.7 18.7-49.1 18.7-67.9 0l-87.4-87.4L408.6 262.6z'></path>
                                    </svg>
                                    مساحت
                                </div>
                                <div class='data '>
                                    {p.prices.length
                                        ? p.prices[0].area + ' متر'
                                        : 'نامعلوم'}
                                </div>
                            </div>
                        </figcaption>
                        <div class='btns'>
                            <A
                                href={`/admin/projects/${p.project_id}/`}
                                class='edit title_smaller'
                            >
                                <EditIcon />
                                تنظیم
                            </A>
                            <button
                                onclick={() => {
                                    delete_project(p)
                                }}
                                class='basic-button title_smaller delete'
                            >
                                <DeleteIcon />
                                حذف
                            </button>
                        </div>
                    </figure>
                ))}
            </div>
        </section>
    )
}
