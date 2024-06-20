import { RecordModel } from 'models'

import './style/records.scss'
import { createStore, produce } from 'solid-js/store'
import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { Component, Show, createEffect, createSignal } from 'solid-js'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'
import {
    ArrowLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FileIcon,
    PlusIcon,
} from 'icons'
import { addAlert } from 'comps'

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
                        class='styled icon'
                        style={{ '--color': 'var(--blue)' }}
                        onClick={() => nav('/projects/' + pid)}
                    >
                        <ArrowLeftIcon />
                    </button>
                </div>
                <div>
                    <button
                        class='styled icon'
                        disabled={state.page < 1}
                        onClick={() => record_list(state.page - 1)}
                    >
                        <ChevronLeftIcon />
                    </button>
                    <button
                        class='styled icon'
                        style={{ '--color': 'var(--green)' }}
                        onClick={record_add}
                    >
                        <PlusIcon />
                    </button>
                    <button
                        class='styled icon'
                        disabled={state.records.length < 32}
                        onClick={() => record_list(state.page + 1)}
                    >
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>
            <div class='record-list'>
                {state.records.map((r, i) => (
                    <Record
                        pid={pid}
                        r={r}
                        update={record =>
                            setState(
                                produce(s => {
                                    s.records[i] = record
                                })
                            )
                        }
                    />
                ))}
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

    return (
        <div class='record'>
            <div class='dpy'>
                <Show
                    when={P.r.mime && P.r.mime.startsWith('image/')}
                    fallback={<FileIcon />}
                >
                    <img
                        draggable={false}
                        loading='lazy'
                        decoding='async'
                        src={`/record/r-${P.r.id}-${P.r.salt}`}
                    />
                </Show>
            </div>
            <div class='line' />
            <div class='info'>
                <span>نام:</span>
                <Show
                    when={edit_name()}
                    fallback={
                        <span
                            class='name'
                            dir='auto'
                            onClick={() => setEditName(true)}
                        >
                            {P.r.name}
                        </span>
                    }
                >
                    <input
                        ref={input_name}
                        value={P.r.name}
                        dir='auto'
                        placeholder='record name'
                        class='name styled'
                        maxLength={255}
                        onChange={e => update_name(e.currentTarget.value)}
                        onBlur={() => setEditName(false)}
                        onContextMenu={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            setEditName(false)
                        }}
                    />
                </Show>
                <span>شناسه:</span>
                <span class='n'>{P.r.id}</span>
                <span>نوع:</span>
                <span class='n'>{P.r.mime}</span>
                <span>حجم:</span>
                <span class='n'>{fmt_bytes(P.r.size)}</span>
                <span>تاریخ:</span>
                <span class='n'>{fmt_datetime(P.r.created_at)}</span>
            </div>
        </div>
    )
}
