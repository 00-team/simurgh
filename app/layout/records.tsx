import { RecordModel } from 'models'

import './style/records.scss'
import { createStore } from 'solid-js/store'
import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { createEffect } from 'solid-js'
import { fmt_bytes, fmt_datetime, httpx } from 'shared'

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

    return (
        <div class='records-fnd'>
            <div class='record-list'>
                {state.records.map(r => (
                    <div class='record'>
                        <div class='info'>
                            <span>نام:</span>
                            <input
                                value={r.name}
                                dir='auto'
                                placeholder='record name'
                                class='styled'
                            />
                            <span>شناسه:</span>
                            <span class='n'>{r.id}</span>
                            <span>پسوند:</span>
                            <span class='n'>{r.ext}</span>
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
