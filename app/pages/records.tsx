import { RecordModel } from 'models'

import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { addAlert, Editable } from 'comps'
import {
    ArrowLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FileIcon,
} from 'icons'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'
import {
    Component,
    createEffect,
    createMemo,
    createSignal,
    Match,
    Show,
    Switch,
} from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import './style/records.scss'

export default () => {
    type State = {
        records: RecordModel[]
        page: number
        edit_name: boolean
    }
    const [params, setParams] = useSearchParams()
    const [state, setState] = createStore<State>({
        records: [],
        page: parseInt(params.page) || 0,
        edit_name: false,
    })
    const { pid } = useParams()
    const nav = useNavigate()

    createEffect(() => {
        record_list(state.page)
        setParams({ page: state.page })
    })

    function record_list(page: number) {
        httpx({
            url: `/api/projects/${pid}/records/`,
            method: 'GET',
            params: { page },
            exclude_status: [404],
            onLoad(x) {
                if (x.status == 404) return nav('/projects/')
                if (x.status != 200) return

                setState({ records: x.response, page })
            },
        })
    }

    function record_add() {
        let el = document.createElement('input')
        el.setAttribute('type', 'file')
        el.setAttribute('multiple', 'true')
        el.onchange = async () => {
            if (!el.files) return
            for (let f of el.files) {
                if (f.size > 200 * 1024 * 1024) {
                    addAlert({
                        type: 'error',
                        subject: 'حجم فایل',
                        content:
                            'حجم فایل مورد نظر بیشتر از حد مجاز است\nحداکثر حجم مجاز 200 مگابایت می باشد',
                        timeout: 5,
                    })
                    return
                }

                await new Promise((resolve, reject) => {
                    let data = new FormData()
                    data.set('record', f)

                    httpx({
                        url: `/api/projects/${pid}/records/`,
                        method: 'POST',
                        data,
                        reject,
                        onLoad(x) {
                            if (x.status != 200) return
                            setState(
                                produce(s => {
                                    s.records.unshift(x.response)
                                })
                            )
                            resolve(0)
                        },
                    })
                })
            }
            record_list(0)
        }
        el.click()
    }

    return (
        <div class='records-fnd'>
            <div class='actions'>
                <div>
                    <button
                        class='go-back icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav('/projects/' + pid)}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
            </div>
            <div class='record-list'>
                <button onclick={record_add} class='new-record title_small'>
                    فایل جدید
                </button>
                <div class='records-wrapper'>
                    {state.records.map((r, i) => (
                        <Record
                            pid={pid}
                            r={r}
                            update={record => {
                                if (!record) return record_list(state.page)

                                setState(
                                    produce(s => {
                                        s.records[i] = record
                                    })
                                )
                            }}
                        />
                    ))}
                </div>
            </div>
            <div class='pages'>
                <button
                    class='icon'
                    onClick={() => record_list(state.page - 1)}
                    classList={{ disable: state.records.length < 31 }}
                    disabled={state.page == 0}
                >
                    <ChevronLeftIcon size={30} />
                </button>
                <button
                    class='icon'
                    classList={{ disable: state.records.length < 31 }}
                    onClick={() => record_list(state.page + 1)}
                    disabled={state.records.length < 31}
                >
                    <ChevronRightIcon size={30} />
                </button>
            </div>
        </div>
    )
}

type RecordProps = {
    pid: string
    r: RecordModel
    update(record?: RecordModel): void
}
const Record: Component<RecordProps> = P => {
    const [edit_name, setEditName] = createSignal(false)

    let input_name: HTMLInputElement
    createEffect(() => {
        if (!edit_name()) return
        input_name.focus()
    })

    function update_name(name: string) {
        setEditName(false)
        name = name.slice(0, 255)
        if (name == P.r.name) return

        httpx({
            url: `/api/projects/${P.pid}/records/${P.r.id}/`,
            method: 'PATCH',
            json: { name },
            onLoad(x) {
                if (x.status != 200) return
                P.update(x.response)
            },
        })
    }

    function record_delete() {
        httpx({
            url: `/api/projects/${P.pid}/records/${P.r.id}/`,
            method: 'DELETE',
            onLoad(x) {
                if (x.status != 200) return
                P.update()
            },
        })
    }

    return (
        <div class='record'>
            <div class='dpy'>
                <RecordDpy r={P.r} />
            </div>
            <div class='line' />
            <div class='info title_smaller'>
                <div class='row'>
                    <span>نام:</span>
                    <div class='name'>
                        <Show
                            when={edit_name()}
                            fallback={
                                <Editable onClick={() => setEditName(true)}>
                                    <span class='name' dir='auto'>
                                        {P.r.name}
                                    </span>
                                </Editable>
                            }
                        >
                            <input
                                ref={input_name}
                                value={P.r.name}
                                dir='auto'
                                placeholder='record name'
                                class='name styled'
                                maxLength={255}
                                onChange={e =>
                                    update_name(e.currentTarget.value)
                                }
                                onBlur={() => setEditName(false)}
                                onContextMenu={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setEditName(false)
                                }}
                            />
                        </Show>
                        {/* <Confact
                            color='var(--red)'
                            onAct={record_delete}
                            timer_ms={15e2}
                            icon={TrashIcon}
                        /> */}
                    </div>
                </div>

                <div class='row'>
                    <span>شناسه:</span>
                    <span class='n'>{P.r.id}</span>
                </div>
                <div class='row'>
                    <span>نوع:</span>
                    <span class='n'>{P.r.mime}</span>
                </div>
                <div class='row'>
                    <span>حجم:</span>
                    <span class='n'>{fmt_bytes(P.r.size)}</span>
                </div>
                <div class='row'>
                    <span>تاریخ:</span>
                    <span class='n'>{fmt_datetime(P.r.created_at)}</span>
                </div>
            </div>
        </div>
    )
}

type RecordDpyProps = { r: RecordModel }
const RecordDpy: Component<RecordDpyProps> = P => {
    const url = createMemo(() => `/simurgh-record/r-${P.r.id}-${P.r.salt}`)

    return (
        <Switch fallback={<FileIcon />}>
            <Match when={P.r.mime.startsWith('image/')}>
                <Show
                    when={!P.r.mime.includes('svg')}
                    fallback={<DynamicSvg url={url()} />}
                >
                    <img
                        draggable={false}
                        loading='lazy'
                        decoding='async'
                        src={url()}
                        onClick={e => e.currentTarget.requestFullscreen()}
                    />
                </Show>
            </Match>
            <Match when={P.r.mime.startsWith('text/')}>
                <DpyText url={url()} />
            </Match>
            <Match when={P.r.mime.startsWith('video/')}>
                <video src={url()} controls draggable={false}></video>
            </Match>
        </Switch>
    )
}

const DynamicSvg: Component<{ url: string }> = P => {
    let ref: HTMLDivElement

    createEffect(() => {
        httpx({
            url: P.url,
            method: 'GET',
            type: 'text',
            show_messages: false,
            onLoad(x) {
                if (x.status != 200) {
                    ref.parentElement.append(FileIcon() as Node)
                    ref.remove()
                    return
                }

                ref.innerHTML = x.response
            },
        })
    })

    return (
        <div
            class='dpy-svg'
            ref={ref}
            onClick={e => e.currentTarget.requestFullscreen()}
        />
    )
}

const DpyText: Component<{ url: string }> = P => {
    let ref: HTMLTextAreaElement

    createEffect(() => {
        httpx({
            url: P.url,
            method: 'GET',
            type: 'text',
            show_messages: false,
            onLoad(x) {
                if (x.status != 200) {
                    ref.parentElement.append(FileIcon() as Node)
                    ref.remove()
                    return
                }

                ref.value = x.response
            },
        })
    })

    return (
        <textarea
            ref={ref}
            class='styled'
            dir='auto'
            onClick={e => e.currentTarget.requestFullscreen()}
        />
    )
}
