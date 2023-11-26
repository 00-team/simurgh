import { ImageIcon } from '!/icons/dashboard'
import { TextIcon } from '!/icons/editor'
import { Component } from 'solid-js'

export type EmptyBlock = {
    type: 'empty'
}

export type TextGroupData = {
    content: string[]
    style: {
        color?: string
        fontSize?: number
    }
}

export type TextBlock = {
    type: 'text'
    data: TextGroupData[]
    active: number
    style: {
        direction?: 'ltr' | 'rtl'
    }
}

export type ImageBlock = {
    type: 'image'
    url: string
    record_id: number
}

export type Block = TextBlock | ImageBlock | EmptyBlock

export const DEFAULT_BLOCKS: { [T in Block as T['type']]: T } = {
    empty: { type: 'empty' },
    text: {
        type: 'text',
        data: [],
        active: -1,
        style: {},
    },
    image: { type: 'image', url: '', record_id: -1 },
}

export type BlockCosmetic = {
    title: string
    icon: Component
}

type BlockCosmeticMap = Omit<
    { [T in Block as T['type']]: BlockCosmetic },
    'empty'
>
export const BLOCK_COSMETIC: BlockCosmeticMap = {
    text: { title: 'Text', icon: TextIcon },
    image: { title: 'Image', icon: ImageIcon },
}
