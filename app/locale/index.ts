import fa from './fa'
import { Getter, Locale } from './types'
export { DAYS_OF_WEEK } from './types'
export * from './comp'

const LANG_LIST = {
    fa,
} satisfies { [k: string]: Locale }

function user_locale(): keyof typeof LANG_LIST {
    return 'fa'
}

// @ts-ignore
export const LOCALE: Getter = Object.keys(fa).reduce((a, k) => {
    let lowkey = k.toLowerCase()

    // @ts-ignore
    a[lowkey] = v => {
        let lang = user_locale()
        // @ts-ignore
        return LANG_LIST[lang][k][v] as string
    }

    // @ts-ignore
    a[`${lowkey}_list`] = () => {
        let lang = user_locale()
        // @ts-ignore
        return LANG_LIST[lang][k]
    }

    // @ts-ignore
    a[`${lowkey}_entries`] = () => {
        let lang = user_locale()
        // @ts-ignore
        return Object.entries(LANG_LIST[lang][k])
    }

    return a
}, {})
