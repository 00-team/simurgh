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

export type BlogModel = {
    id: number
    slug: string
    project: number | null
    author: number | null
    created_at: number
    updated_at: number
    title: string
    detail: string
    data: string
    html: string
    thumbnail: string | null
    read_time: number | null
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
