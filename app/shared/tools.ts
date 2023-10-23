import { addProgress, delProgress, updateProgress } from '!/components/progress'

function check_email(email: string): boolean {
    const [id, domain] = email.split('@')
    if (!id || !domain) return false

    let ddi = domain.indexOf('.')
    if (ddi == -1 || ddi == domain.length - 1 || !ddi) return false

    return true
}

type HttpxProps = {
    url: string | URL
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'
    json?: unknown
    data?: FormData
    params?: {
        [k: string]: string | boolean | number
    }
    type?: XMLHttpRequestResponseType
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

async function httpx(props: HttpxProps) {
    const { url, method, type, headers } = props
    let http = new XMLHttpRequest()

    const oul = typeof url == 'string' ? new URL(url) : url

    if (props.params) {
        Object.entries(props.params).forEach(([k, v]) =>
            oul.searchParams.set(k, `${v}`)
        )
    }

    http.open(method, oul, true)
    if (type) http.responseType = type

    if (
        (props.json || props.data) &&
        !['PUT', 'POST', 'PATCH'].includes(method)
    ) {
        throw new Error(`request with method: ${method} cannot have any body`)
    }

    let body: XMLHttpRequestBodyInit = null

    if (props.json) {
        http.setRequestHeader('Content-Type', 'application/json')
        body = JSON.stringify(props.json)
    } else if (props.data) {
        http.setRequestHeader('Content-Type', 'multipart/form-data')
        body = props.data
    }

    Object.entries(headers).forEach(([key, value]) => {
        http!.setRequestHeader(key, value)
    })

    let progress_index = addProgress(0)

    http.onerror = function (e) {
        if (props.onError) props.onError(this, e)
        delProgress(progress_index)
        if (props.reject) props.reject(this.statusText)
    }
    http.ontimeout = function (e) {
        if (props.onTimeout) props.onTimeout(this, e)
        delProgress(progress_index)
        if (props.reject) props.reject(this.statusText)
    }
    http.onabort = function (e) {
        if (props.onAbort) props.onAbort(this, e)
        delProgress(progress_index)
        if (props.reject) props.reject(this.statusText)
    }
    http.onloadstart = function (e) {
        if (props.onLoadStart) props.onLoadStart(this, e)
        delProgress(progress_index)
    }
    http.onload = function (e) {
        if (props.onLoad) props.onLoad(this, e)
        delProgress(progress_index)
    }
    http.onreadystatechange = function () {
        if (props.onReadyStateChange) props.onReadyStateChange(this)
    }

    if (props.onProgress) {
        http.onprogress = function (e) {
            props.onProgress!(this, e)
            updateProgress(progress_index, e.loaded, e.total || e.loaded + 100)
        }
    } else {
        http.onprogress = function (e) {
            updateProgress(progress_index, e.loaded, e.total || e.loaded + 100)
        }
    }

    http.send(body)
}

export { check_email, httpx }
