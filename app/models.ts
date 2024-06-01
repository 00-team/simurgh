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
    timestamp: number
    api_key: string | null
}
