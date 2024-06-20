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

type BlogStyle = {
    color: string | null
    bold: boolean
    italic: boolean
    underline: boolean
    font_size: number
}

type BlogTextGroup = {
    content: string[]
    style: BlogStyle
}

type BlogText = {
    kind: 'text'
    dir: 'ltr' | 'rtl'
    groups: BlogTextGroup[]
}

type BlogImage = {
    kind: 'image'
    record_id: number
    record_salt: string
}

type BlogEmpty = {
    kind: 'empty'
}

type BlogData = BlogText | BlogImage | BlogEmpty

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
export const DEFAULT_BLOG = {
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
