import * as a from 'abi'

import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { addAlert } from 'comps'
import {
    ArrowLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FileIcon,
    PlusIcon,
    TrashIcon,
} from 'icons'
import { fmt_bytes, fmt_datetime, record_url } from 'shared'
import { Component, createEffect, Match, Switch } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { setPopup } from 'store/popup'
import './style/records.scss'

export default () => {
    type State = {
        records: a.Record[]
        page: number
        edit_name: boolean
    }
    const [params, setParams] = useSearchParams()
    const [state, setState] = createStore<State>({
        records: [],
        page: parseInt(params.page || '0') || 0,
        edit_name: false,
    })
    const { pid } = useParams()
    const nav = useNavigate()

    createEffect(() => {
        record_list(state.page)
        setParams({ page: state.page })
    })

    async function record_list(page: number) {
        let r = await a.api_projects_records_list({ pid: parseInt(pid), page })
        if (r.err()) return
        setState({ records: r.body, page })
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
                            pid={parseInt(pid)}
                            r={r}
                            update={async record => {
                                if (!record) {
                                    return await record_list(state.page)
                                }

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
                    classList={{ disable: state.records.length < 31 }}
                    onClick={() => record_list(state.page + 1)}
                    disabled={state.records.length < 31}
                >
                    <ChevronRightIcon />
                </button>
                <button
                    class='icon'
                    onClick={() => record_list(state.page - 1)}
                    classList={{ disable: state.page == 0 }}
                    disabled={state.page == 0}
                >
                    <ChevronLeftIcon />
                </button>
            </div>
        </div>
    )
}

type RecordProps = {
    pid: number
    r: a.Record
    update(record?: a.Record): void
}
const Record: Component<RecordProps> = P => {
    // const [edit_name, setEditName] = createSignal(false)

    // let input_name!: HTMLInputElement
    // createEffect(() => {
    //     if (!edit_name()) return
    //     input_name.focus()
    // })

    async function record_update(data: Partial<Pick<a.Record, 'usages'>>) {
        // httpx({
        //     url: `/api/projects/${P.pid}/records/${P.r.id}/`,
        //     method: 'PATCH',
        //     json: { name: P.r.name, usages: P.r.usages, ...data },
        //     onLoad(x) {
        //         if (x.status != 200) return
        //         P.update(x.response)
        //     },
        // })

        let r = await a.api_projects_records_patch(
            { pid: P.pid, rid: P.r.id },
            { usages: data.usages || P.r.usages }
        )
        if (r.err()) return
        P.update(r.body)
    }

    function remove_usage(idx: number) {
        let usages = [...P.r.usages]
        usages.splice(idx, 1)
        record_update({ usages })
    }

    // function update_name(name: string) {
    //     setEditName(false)
    //     name = name.slice(0, 255)
    //     if (name == P.r.name) return
    //
    //     httpx({
    //         url: `/api/projects/${P.pid}/records/${P.r.id}/`,
    //         method: 'PATCH',
    //         json: { name },
    //         onLoad(x) {
    //             if (x.status != 200) return
    //             P.update(x.response)
    //         },
    //     })
    // }

    async function record_delete() {
        let r = await a.api_projects_records_del({ pid: P.pid, rid: P.r.id })
        if (r.err()) return
        P.update()
    }

    return (
        <div class='record'>
            <div class='delete-rec'>
                <button
                    class='cta delete'
                    onclick={() => {
                        setPopup({
                            show: true,
                            title: 'حذف فایل',
                            Icon: TrashIcon,
                            type: 'error',
                            content: 'از حذف فایل مطمعنید؟',
                            onSubmit: () => record_delete(),
                        })
                    }}
                >
                    <TrashIcon />
                </button>
            </div>
            <div class='dpy'>
                <RecordDpy r={P.r} />
            </div>
            <div class='line' />
            <div class='info title_smaller'>
                <div class='row'>
                    <span>شناسه:</span>
                    <span class='n'>{P.r.id}</span>
                </div>
                <div class='row'>
                    <span>نوع:</span>
                    <span class='n'>{P.r.kind}</span>
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
            <div class='usages'>
                <h3 class='title_small'>استفاده ها</h3>
                <div class='usages-wrapper'>
                    {P.r.usages.map((u, ui) => (
                        <div
                            class='usage title_smaller'
                            onclick={() => {
                                if (u.kind == 'blog') {
                                    open(
                                        `/projects/${P.r.project}/blogs/${u.id}/`,
                                        '_blank'
                                    )
                                }
                            }}
                            oncontextmenu={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                remove_usage(ui)
                            }}
                        >
                            {u.kind === 'free'
                                ? 'آزاد: ' + u.reason
                                : 'بلاگ: ' + u.id}
                        </div>
                    ))}
                </div>
                <AddUsage record={P.r} update={r => P.update(r)} />
            </div>
        </div>
    )
}

type AddUsageProps = {
    record: a.Record
    update(record: a.Record): void
}
const AddUsage: Component<AddUsageProps> = P => {
    type State = {
        usage: a.RecordUsage
    }

    const [state, setstate] = createStore<State>({
        usage: { kind: 'free', reason: '' },
    })

    async function record_update() {
        let usages = [...P.record.usages, state.usage]
        let r = await a.api_projects_records_patch(
            { pid: P.record.project, rid: P.record.id },
            { usages }
        )
        if (r.err()) return
        P.update(r.body)
    }

    return (
        <form
            action={''}
            onsubmit={e => {
                e.preventDefault()
                record_update()
            }}
            class='add-usage title_small'
        >
            <div
                class='toggle-btn'
                onclick={() => {
                    if (state.usage.kind === 'blog')
                        return setstate({
                            usage: { kind: 'free', reason: '' },
                        })

                    setstate({ usage: { kind: 'blog', id: 0 } })
                }}
            >
                <div
                    class='usage-holder title_smaller'
                    classList={{ active: state.usage.kind === 'blog' }}
                >
                    <div class='holder'>آزاد</div>
                    <div class='holder blog'>بلاگ</div>
                </div>
            </div>
            <div class='input'>
                {state.usage.kind === 'free' ? (
                    <>
                        <input
                            type='text'
                            class='title_smaller'
                            name=''
                            id=''
                            placeholder='مورد استفاده...'
                            onInput={e => {
                                setstate({
                                    usage: {
                                        kind: 'free',
                                        reason: e.currentTarget.value,
                                    },
                                })
                            }}
                        />
                    </>
                ) : (
                    <>
                        <input
                            type='number'
                            class='title_smaller'
                            name=''
                            id=''
                            inputMode={'numeric'}
                            placeholder='شماره مقاله...'
                            min={0}
                            oninput={e => {
                                setstate(
                                    produce(s => {
                                        if (s.usage.kind == 'blog') {
                                            s.usage.id =
                                                parseInt(
                                                    e.currentTarget.value
                                                ) || 1
                                        }
                                    })
                                )
                            }}
                        />
                    </>
                )}
            </div>
            <button class='add-btn' type='submit'>
                <PlusIcon />
            </button>
        </form>
    )
}

type RecordDpyProps = { r: a.Record }
const RecordDpy: Component<RecordDpyProps> = P => {
    return (
        <Switch fallback={<FileIcon />}>
            <Match when={P.r.kind == 'photo'}>
                <img
                    draggable={false}
                    loading='lazy'
                    decoding='async'
                    src={record_url(P.r)}
                    // onClick={e => e.currentTarget.requestFullscreen()}
                />
            </Match>
            <Match when={P.r.kind == 'video'}>
                <video src={record_url(P.r)} controls draggable={false}></video>
            </Match>
        </Switch>
    )
}

// const DynamicSvg: Component<{ url: string }> = P => {
//     let ref: HTMLDivElement
//
//     createEffect(() => {
//         httpx({
//             url: P.url,
//             method: 'GET',
//             type: 'text',
//             show_messages: false,
//             onLoad(x) {
//                 if (x.status != 200) {
//                     ref.parentElement.append(FileIcon() as Node)
//                     ref.remove()
//                     return
//                 }
//
//                 ref.innerHTML = x.response
//             },
//         })
//     })
//
//     return (
//         <div
//             class='dpy-svg'
//             ref={ref}
//             onClick={e => e.currentTarget.requestFullscreen()}
//         />
//     )
// }

// const DpyText: Component<{ url: string }> = P => {
//     let ref: HTMLTextAreaElement
//
//     createEffect(() => {
//         httpx({
//             url: P.url,
//             method: 'GET',
//             type: 'text',
//             show_messages: false,
//             onLoad(x) {
//                 if (x.status != 200) {
//                     ref.parentElement.append(FileIcon() as Node)
//                     ref.remove()
//                     return
//                 }
//
//                 ref.value = x.response
//             },
//         })
//     })
//
//     return (
//         <textarea
//             ref={ref}
//             class='styled'
//             dir='auto'
//             onClick={e => e.currentTarget.requestFullscreen()}
//         />
//     )
// }
