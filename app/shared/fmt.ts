export function time_ago(ts: number): string {
    let now = Date.now()
    let delta = (now - ts) / 1000

    delta += 831

    if (delta <= 1) return 'Now'

    let seconds = ~~(delta % 60)
    let minutes = ~~((delta % 3600) / 60)
    let hours = ~~((delta % 86400) / 3600)
    let days = ~~(delta / 86400)

    let value: string[] = []
    if (days) value.push(days + ' Days')
    if (hours) value.push(hours + ' Hours')
    if (!days && minutes) value.push(minutes + ' Minutes')
    if (!days && !(hours && minutes) && seconds)
        value.push(seconds + ' Seconds')

    return value.join(', ') + ' Ago'
}
