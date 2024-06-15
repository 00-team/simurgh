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
    user: number
    name: string
    blog_count: number
    record_count: number
    storage: number
    created_at: number
    updated_at: number
    api_key: string | null
}

export type BlogModel = {
    id: number
    slug: string
    project: number
    author: number
    created_at: number
    updated_at: number
    thumbnail: string | null
    read_time: number | null
}

export type BlogContentModel = {
    id: number
    blog: number
    title: string
    lang: number
    detail: string
    data: string
    html: string
}

export type RecordModel = {}
