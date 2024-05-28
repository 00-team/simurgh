import { addAlert } from 'comps/alert'

type HttpxProps = {
    url: string | URL
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'
    json?: unknown
    data?: FormData
    params?: {
        [k: string]: string | boolean | number
    }
    type?: XMLHttpRequestResponseType
    show_messages?: boolean
    bearer?: string
    exclude_status?: number[]
    reject?(reson?: string): void
    onReadyStateChange?(x: XMLHttpRequest): void
    onLoad?(x: XMLHttpRequest, ev: ProgressEvent): void
    onProgress?(x: XMLHttpRequest, ev: ProgressEvent): void
    onError?(x: XMLHttpRequest, e: ProgressEvent): void
    onAbort?(x: XMLHttpRequest, e: ProgressEvent): void
    onTimeout?(x: XMLHttpRequest, e: ProgressEvent): void
    onLoadStart?(x: XMLHttpRequest, e: ProgressEvent): void
    onLoadStart?(x: XMLHttpRequest, e: ProgressEvent): void
    headers?: {
        [k: string]: string
    }
}

function httpx(P: HttpxProps) {
    const { url, type = 'json', headers, show_messages = true } = P
    let http = new XMLHttpRequest()

    const oul = typeof url == 'string' ? new URL(url, location.href) : url

    if (P.params) {
        Object.entries(P.params).forEach(([k, v]) =>
            oul.searchParams.set(k, `${v}`)
        )
    }

    http.open(P.method, oul, true)
    if (type) http.responseType = type

    if ((P.json || P.data) && !['PUT', 'POST', 'PATCH'].includes(P.method)) {
        throw new Error(`request with method: ${P.method} cannot have any body`)
    }

    let body: XMLHttpRequestBodyInit = null

    if (P.json) {
        http.setRequestHeader('Content-Type', 'application/json')
        body = JSON.stringify(P.json)
    } else if (P.data) {
        body = P.data
    }

    if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
            http!.setRequestHeader(key, value)
        })
    }

    if (P.bearer) {
        http.setRequestHeader('Authorization', 'Bearer ' + P.bearer)
    }

    // let puid = addProgress(0)

    function cleanup(x: XMLHttpRequest) {
        if (P.reject) P.reject(x.statusText)
        // delProgress(puid)
    }

    http.onerror = function (e) {
        if (P.onError) P.onError(this, e)
        cleanup(this)
    }
    http.ontimeout = function (e) {
        if (P.onTimeout) P.onTimeout(this, e)
        cleanup(this)
    }
    http.onabort = function (e) {
        if (P.onAbort) P.onAbort(this, e)
        cleanup(this)
    }
    http.onloadstart = function (e) {
        if (P.onLoadStart) P.onLoadStart(this, e)
    }
    http.onload = function (e) {
        if (P.onLoad) P.onLoad(this, e)

        // delProgress(puid)
        if (show_messages) {
            if (P.exclude_status && P.exclude_status.includes(this.status))
                return

            if (this.status == 200 && type == 'json') {
                if (this.response && this.response.message) {
                    addAlert({
                        type: 'success',
                        timeout: 5,
                        ...this.response.message,
                    })
                }
            } else if (this.response && this.response.code) {
                addAlert({
                    type: 'error',
                    timeout: 10,
                    ...this.response,
                })
            }
        }
    }
    http.onreadystatechange = function () {
        if (P.onReadyStateChange) P.onReadyStateChange(this)
    }

    if (P.onProgress) {
        http.onprogress = function (e) {
            P.onProgress!(this, e)
            // updateProgress(puid, e.loaded, e.total || e.loaded + 100)
        }
    }

    http.send(body)
}
export { httpx }
