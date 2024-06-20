const CRTABLE = {
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
}

function irn_replace(str: string): string {
    let out = ''
    for (let c of str) {
        out += CRTABLE[c] || c
    }
    return out
}

export function fmt_datetime(ts: number): string {
    if (ts == 0) return '---'
    let d = new Date(ts * 1e3)
    // let [year, month, day] = irn_replace(d.toLocaleDateString('fa')).split('/')
    let date = irn_replace(d.toLocaleDateString('fa'))
    let [hour, minute] = irn_replace(d.toLocaleTimeString('fa')).split(':')

    return `${date} ${hour.padStart(2, '0')}:${minute}`
}

export function fmt_bytes(b: number): string {
    if (b < 1024) return b.toLocaleString() + ' b'
    if (b < 1048576) return (~~(b / 102.4) / 10).toLocaleString() + ' Kb'
    if (b < 1073741824) return (~~(b / 104857.6) / 10).toLocaleString() + ' Mb'
    if (b < 1099511627776)
        return (~~(b / 107374182.4) / 10).toLocaleString() + ' Gb'
    return (~~(b / 109951162777.6) / 10).toLocaleString() + ' Tb'
}

function pad0(v: string | number): string {
    return v.toString().padStart(2, '0')
}

type ParsedSeconds = {
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
}
export function fmt_parse_seconds(seconds: number): ParsedSeconds {
    let months = ~~(seconds / 2592000)
    let O = months * 2592000
    let days = ~~((seconds - O) / 86400)
    O = O + days * 86400
    let hours = ~~((seconds - O) / 3600)
    O = O + hours * 3600
    let minutes = ~~((seconds - O) / 60)
    O = O + minutes * 60
    seconds = seconds - O

    return {
        months,
        days,
        hours,
        minutes,
        seconds,
    }
}

export function fmt_mdhms(ts: number): string {
    let { months, days, hours, minutes, seconds } = fmt_parse_seconds(ts)
    return `${months} ماه و ${days} روز و ${pad0(hours)}:${pad0(minutes)}:${pad0(seconds)}`
}

export function fmt_hms(ts: number): string {
    let { months, days, hours, minutes, seconds } = fmt_parse_seconds(ts)
    hours = days * 24 + months * 720
    return `${hours} ساعت و ${minutes} دقیقه و ${seconds} ثانیه`
}
