import { RecordModel } from 'models'

import './style/records.scss'
import { createStore, produce } from 'solid-js/store'
import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { createEffect } from 'solid-js'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'
import {
    ArrowLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
} from 'icons'

export default () => {
    type State = {
        records: RecordModel[]
    }
    const [state, setState] = createStore<State>({ records: [] })
    const [params, setParams] = useSearchParams()
    const { pid } = useParams()
    const nav = useNavigate()

    createEffect(() => {
        records_fetch(parseInt(params.page || '0') || 0)
    })

    function records_fetch(page: number) {
        setParams({ page })
        httpx({
            url: `/api/projects/${pid}/records/`,
            method: 'GET',
            params: { page },
            exclude_status: [404],
            onLoad(x) {
                if (x.status == 404) return nav('/projects/')
                if (x.status != 200) return

                setState({ records: x.response })
            },
        })
    }

    function records_update(id: number, name: string, idx: number) {
        httpx({
            url: `/api/projects/${pid}/records/${id}/`,
            method: 'PATCH',
            json: { name },
            onLoad(x) {
                if (x.status != 200) return

                setState(
                    produce(s => {
                        s.records[idx] = x.response
                    })
                )
            },
        })
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
                    <button class='styled icon'>
                        <ChevronLeftIcon />
                    </button>
                    <button
                        class='styled icon'
                        style={{ '--color': 'var(--green)' }}
                    >
                        <PlusIcon />
                    </button>
                    <button class='styled icon'>
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>
            <div class='record-list'>
                {state.records.map((r, i) => (
                    <div class='record'>
                        <div class='info'>
                            <span>نام:</span>
                            <input
                                value={r.name}
                                dir='auto'
                                placeholder='record name'
                                class='styled'
                                maxLength={255}
                                onBlur={e => {
                                    let name = e.currentTarget.value
                                    if (name == r.name) return
                                    records_update(r.id, name, i)
                                }}
                                onChange={e => {
                                    let name = e.currentTarget.value
                                    if (name == r.name) return
                                    records_update(r.id, name, i)
                                }}
                            />
                            <span>شناسه:</span>
                            <span class='n'>{r.id}</span>
                            <span>نوع:</span>
                            <span class='n'>{r.mime}</span>
                            <span>حجم:</span>
                            <span class='n'>{fmt_bytes(r.size)}</span>
                            <span>تاریخ:</span>
                            <span class='n'>{fmt_datetime(r.created_at)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
