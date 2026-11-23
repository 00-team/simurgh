import { alert_code } from 'comps/alert'
import { API_VERSION, AppErr, is_nest_error } from './gen'
import { isServer } from 'solid-js/web'

export type HttpxProps = {
    url: string | URL
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'
    json?: unknown
    data?: XMLHttpRequestBodyInit
    params?: {
        [k: string]: string | boolean | number | undefined | null
    }
    show_alert?: boolean
    exclude_status?: number[]
    headers?: {
        [k: string]: string
    }
}

export async function httpx(P: HttpxProps): Promise<[Response, HttpxProps]> {
    const { url, headers: ih, show_alert = true } = P
    let headers = ih || {}

    let oul =
        typeof url == 'string'
            ? new URL(url, isServer ? globalThis.HOST : location.href)
            : url

    if (P.params) {
        for (let [k, v] of Object.entries(P.params)) {
            if (v == null || v == void 0) continue
            oul.searchParams.set(k, v.toString())
        }
    }

    if ((P.json || P.data) && !['PUT', 'POST', 'PATCH'].includes(P.method)) {
        throw new Error(`request with method: ${P.method} cannot have any body`)
    }

    let body: XMLHttpRequestBodyInit | null = null

    if (P.json) {
        headers['Content-Type'] = 'application/json'
        // http.setRequestHeader('Content-Type', 'application/json')
        body = JSON.stringify(P.json)
    } else if (P.data) {
        body = P.data
    }

    // if (isServer && process.env.SSR_AUTH) {
    //     headers['x-gooje-auth-ssr'] = process.env.SSR_AUTH
    // }

    let r = await fetch(oul, {
        method: P.method,
        body,
        headers,
    })

    let rc = r.clone()

    let av = r.headers.get('x-api-version')
    if (av && av != API_VERSION) {
        console.error('you must update ...\napi version mismatch ...')
        throw new Error('api version mismatch')
    }

    // if (P.onLoad) P.onLoad(rc)

    if (!show_alert) return [rc, P]

    if (
        r.status == 200 ||
        (P.exclude_status && P.exclude_status.includes(r.status))
    )
        return [rc, P]
    try {
        let apperr: AppErr = await r.json()
        if (is_nest_error(apperr.code)) {
            alert_code(apperr.code)
        }
    } catch {}

    return [rc, P]
}
