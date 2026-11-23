import * as a from 'abi'

export function record_url(r: a.Record): string {
    let sp = r.salt.slice(0, 2)

    const EXT_MAP: Record<a.RecordKind, string> = {
        photo: '.webp',
        video: '.mp4',
    }

    let ext = EXT_MAP[r.kind]

    return `/simurgh-record/${r.project}/${sp}/${r.id}-${r.salt}${ext}`
}
