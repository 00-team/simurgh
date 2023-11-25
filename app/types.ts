type ProjectModel = {
    project_id: number
    creator: number
    name: string
    storage: string
    blogs: string
    records: number
    created_at: number
    edited_at: number
    api_key: string | null
}

type ProjectRecord = {
    record_id: number
    project: number
    size: number
    mime: string
    ext: string
    timestamp: number
    url: string
    name: string
}

type BlogCategory = {
    category_id: number
    project: number
    slug: string
    label: {}
}

export type { ProjectModel, ProjectRecord, BlogCategory }
