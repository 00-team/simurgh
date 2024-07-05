import {
    AlignCenterIcon,
    AlignLeftIcon,
    AlignRightIcon,
    LeftToRightIcon,
    RightToLeftIcon,
} from 'icons'
import { JSX } from 'solid-js'

export type UserModel = {
    id: number
    email: string
    name?: string | null
    photo?: string | null
    token: string
    admin: boolean
    client: boolean
    banned: boolean
}

export type ProjectModel = {
    id: number
    user: number | null
    name: string
    blog_count: number
    record_count: number
    storage: number
    created_at: number
    updated_at: number
    api_key: string | null
}

export type BlogStyle = {
    color: string | null
    bold: boolean
    italic: boolean
    underline: boolean
    code: boolean
    mark: boolean
    font_size: number
    font_family: string | null
}

export const DEFAULT_STYLE: BlogStyle = {
    color: null,
    bold: false,
    italic: false,
    underline: false,
    code: false,
    mark: false,
    font_size: 18,
    font_family: null,
}

export type BlogTextGroup = {
    content: string[]
    url: string | null
    style: BlogStyle
}

export const DEFAULT_TEXT_GROUP: BlogTextGroup = {
    content: [],
    url: null,
    style: DEFAULT_STYLE,
}

export type BlogDirection = 'ltr' | 'rtl'
export const BLOG_DIRECTION: {
    [k in BlogDirection]: [BlogDirection, () => JSX.Element, string]
} = {
    ltr: ['rtl', LeftToRightIcon, 'چپ به راست'],
    rtl: ['ltr', RightToLeftIcon, 'راست به چپ'],
}

export type BlogAlign = 'left' | 'center' | 'right'
export const BLOG_ALIGN: {
    [k in BlogAlign]: [BlogAlign, () => JSX.Element, string]
} = {
    left: ['center', AlignLeftIcon, 'چپ'],
    center: ['right', AlignCenterIcon, 'وسط'],
    right: ['left', AlignRightIcon, 'راست'],
}

export type BlogHeading = {
    kind: 'heading'
    level: number
    content: string
    dir: BlogDirection
    align: BlogAlign
}

export type BlogText = {
    kind: 'text'
    dir: BlogDirection
    align: BlogAlign
    groups: BlogTextGroup[]
}

export type BlogImage = {
    kind: 'image'
    record_id: number | null
    url: string
    align: BlogAlign
    alt: string
}

export type BlogBreak = { kind: 'break' }
export type BlogEmpty = { kind: 'empty' }

export type BlogData =
    | BlogText
    | BlogImage
    | BlogEmpty
    | BlogHeading
    | BlogBreak

export const DEFAULT_BLOCKS: { [T in BlogData as T['kind']]: T } = {
    empty: { kind: 'empty' },
    break: { kind: 'break' },
    heading: {
        kind: 'heading',
        level: 1,
        content: '',
        dir: 'ltr',
        align: 'left',
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
        align: 'left',
        alt: '',
    },
} as const

export type BlogModel = {
    id: number
    slug: string
    status: 'draft' | 'published'
    project: number | null
    author: number | null
    created_at: number
    updated_at: number
    title: string
    detail: string
    data: BlogData[]
    html: string
    thumbnail: string | null
    read_time: number
}
export const DEFAULT_BLOG: BlogModel = {
    id: 0,
    slug: '',
    status: 'draft',
    project: null,
    author: null,
    created_at: 0,
    updated_at: 0,
    title: '',
    detail: '',
    data: [],
    html: '',
    thumbnail: null,
    read_time: 0,
}

export type RecordUsages =
    | { kind: 'free'; reason: string }
    | { kind: 'blog'; id: number }
export const DEFAULT_RECORD_USAGES: { [T in RecordUsages as T['kind']]: T } = {
    free: { kind: 'free', reason: '' },
    blog: { kind: 'blog', id: 1 },
}

export type RecordModel = {
    id: number
    project: number | null
    name: string
    salt: string
    size: number
    created_at: number
    mime: string | null
    usages: RecordUsages[]
}
