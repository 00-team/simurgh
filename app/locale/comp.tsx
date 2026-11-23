import { Component, createMemo, Show } from 'solid-js'
import { GetterComp, GetterGet } from './types'
import { LOCALE } from 'locale'

type PartialOneOf<T> = {
    [K in keyof T]: { [P in K]: T[P] } & Partial<
        Record<Exclude<keyof T, K>, never>
    >
}[keyof T]

export const Locale: Component<PartialOneOf<GetterComp>> = P => {
    const k = createMemo(() => {
        return Object.entries(P)[0] as [keyof GetterGet, any]
    })

    // @ts-ignore
    return <Show when={k()}>{LOCALE[k()[0]](k()[1])}</Show>
}
