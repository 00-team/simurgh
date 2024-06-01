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

    return `${date} ${hour}:${minute}`
}

export function fmt_bytes(b: number): string {
    if (b < 1024) return b.toLocaleString() + ' b'
    if (b < 1048576) return (~~(b / 1024)).toLocaleString() + ' Kb'
    if (b < 1073741824) return (~~(b / 1048576)).toLocaleString() + ' Mb'
    if (b < 1099511627776) return (~~(b / 1073741824)).toLocaleString() + ' Gb'
    return (~~(b / 1099511627776)).toLocaleString() + ' Tb'
}
