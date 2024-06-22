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
    font_size: number
}

export const DEFAULT_STYLE: BlogStyle = {
    color: null,
    bold: false,
    italic: false,
    underline: false,
    font_size: 18,
}

export type BlogTextGroup = {
    content: string[]
    style: BlogStyle
}

export type BlogText = {
    kind: 'text'
    dir: 'ltr' | 'rtl'
    align: 'left' | 'center' | 'right'
    groups: BlogTextGroup[]
}

export type BlogImage = {
    kind: 'image'
    record_id: number
    record_salt: string
}

export type BlogEmpty = {
    kind: 'empty'
}

export type BlogHeading = {
    kind: 'heading'
    level: number
    content: string
}

export type BlogData = BlogText | BlogImage | BlogEmpty | BlogHeading

export const DEFAULT_BLOCKS: { [T in BlogData as T['kind']]: T } = {
    empty: { kind: 'empty' },
    heading: { kind: 'heading', level: 1, content: '' },
    text: {
        kind: 'text',
        dir: 'ltr',
        align: 'left',
        groups: [],
    },
    image: {
        kind: 'image',
        record_id: 0,
        record_salt: '',
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

export type RecordModel = {
    id: number
    project: number | null
    name: string
    salt: string
    size: number
    created_at: number
    mime: string | null
}
