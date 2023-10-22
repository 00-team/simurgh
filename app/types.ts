type RecordDataModel = {
    id: number
    url: string
}

type ImagesModel = {
    desc: RecordDataModel
    feat: RecordDataModel
    term: RecordDataModel
}

type PriceModel = {
    layout: string
    area: number
    price: number
}

type ProjectModel = {
    project_id: number
    title: string
    description: string
    features: string[]
    sector: string
    latitude: number
    longitude: number
    payment_terms: string
    prices: PriceModel[]
    images: ImagesModel
}

export type { RecordDataModel, ImagesModel, PriceModel, ProjectModel }
