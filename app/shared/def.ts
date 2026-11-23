import * as a from 'abi'

export const DEFAULT_BLOCKS: { [T in a.BlogData as T['kind']]: T } = {
    check_list: {
        kind: 'check_list',
        dir: a.BLOG_DIRECTION_DEF,
        align: a.BLOG_ALIGN_DEF,
        ordered: true,
        items: [],
    },
    list: {
        kind: 'list',
        dir: a.BLOG_DIRECTION_DEF,
        align: a.BLOG_ALIGN_DEF,
        ordered: true,
        items: [],
    },
    empty: { kind: 'empty' },
    break: { kind: 'break' },
    heading: {
        kind: 'heading',
        level: 1,
        content: '',
        dir: 'rtl',
        align: 'right',
    },
    text: {
        kind: 'text',
        dir: 'rtl',
        align: 'right',
        groups: [],
    },
    image: {
        kind: 'image',
        record_id: 0,
        url: '',
        align: 'center',
        alt: '',
    },
    audio: {
        align: 'center',
        kind: 'audio',
        record_id: 0,
        url: '',
    },
    map: {
        align: 'center',
        kind: 'map',
        latitude: 35.6997005458638,
        longitude: 51.337867620465936,
    },
    video: {
        align: 'center',
        kind: 'video',
        record_id: 0,
        url: '',
    },
}
