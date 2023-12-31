import { addAlert } from '!/components/alert'
import { addProgress, delProgress, updateProgress } from '!/components/progress'

function check_email(email: string): boolean {
    const [id, domain] = email.split('@')
    if (!id || !domain) return false

    let ddi = domain.indexOf('.')
    if (ddi == -1 || ddi == domain.length - 1 || !ddi) return false

    return true
}

type Detail = {
    loc: (number | string)[]
    msg: string
    type: string
}

function alert_422(detail: Detail[]) {
    detail.forEach(item => {
        addAlert({
            type: 'error',
            timeout: 10,
            subject: item.type,
            content: `location: ${item.loc.join('.')}\n\n${item.msg}`,
        })
    })

    /* 

    TODO: use cookies.lang for this alert
    let lang = document.cookie
        .split('; ')
        .find(i => i.startsWith('lang='))
        .slice(5)
    */
}

function random_string(
    len: number,
    abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
) {
    if (!abc) throw new Error('invalid alphabet')

    let result = ''
    let n = 0
    while (n < len) {
        result += abc.charAt(~~(Math.random() * abc.length))
        n++
    }
    return result
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
    show_messages?: boolean
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

function httpx(props: HttpxProps) {
    const { url, method, type, headers, show_messages = true } = props
    let http = new XMLHttpRequest()

    const oul = typeof url == 'string' ? new URL(url, location.href) : url

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

    if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
            http!.setRequestHeader(key, value)
        })
    }

    let puid = addProgress(0)

    function cleanup(x: XMLHttpRequest) {
        if (props.reject) props.reject(x.statusText)
        delProgress(puid)
    }

    http.onerror = function (e) {
        if (props.onError) props.onError(this, e)
        cleanup(this)
    }
    http.ontimeout = function (e) {
        if (props.onTimeout) props.onTimeout(this, e)
        cleanup(this)
    }
    http.onabort = function (e) {
        if (props.onAbort) props.onAbort(this, e)
        cleanup(this)
    }
    http.onloadstart = function (e) {
        if (props.onLoadStart) props.onLoadStart(this, e)
    }
    http.onload = function (e) {
        if (props.onLoad) props.onLoad(this, e)

        delProgress(puid)
        if (show_messages && type == 'json') {
            if (this.status == 200) {
                if (this.response.message) {
                    addAlert({
                        type: 'success',
                        timeout: 5,
                        ...this.response.message,
                    })
                }
            } else if (this.status == 422) {
                alert_422(this.response.detail)
            } else if (this.response.code) {
                addAlert({
                    type: 'error',
                    timeout: 10,
                    ...this.response,
                })
            }
        }
    }
    http.onreadystatechange = function () {
        if (props.onReadyStateChange) props.onReadyStateChange(this)
    }

    if (props.onProgress) {
        http.onprogress = function (e) {
            props.onProgress!(this, e)
            updateProgress(puid, e.loaded, e.total || e.loaded + 100)
        }
    } else {
        http.onprogress = function (e) {
            updateProgress(puid, e.loaded, e.total || e.loaded + 100)
        }
    }

    http.send(body)
}

export { check_email, httpx, random_string }
