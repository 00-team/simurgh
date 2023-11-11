import { RouteDataFunc } from '@solidjs/router'
import { Resource, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'

const AP = {
    MASTER: 1n << 0n,

    V_USER: 1n << 1n, // VISION | VIEW
    A_USER: 1n << 2n, // APPEND | ADD
    C_USER: 1n << 3n, // CHANGE | CHANGE
    D_USER: 1n << 4n, // DELETE | DELETE

    V_RECORD: 1n << 9n,
    A_RECORD: 1n << 10n,
    C_RECORD: 1n << 11n,
    D_RECORD: 1n << 12n,

    V_BLOG: 1n << 15n,
    A_BLOG: 1n << 16n,
    C_BLOG: 1n << 17n,
    D_BLOG: 1n << 19n,

    V_GENERAL: 1n << 13n,
    C_GENERAL: 1n << 14n,

    V_MESSAGE: 1n << 20n,
    A_MESSAGE: 1n << 21n,
    C_MESSAGE: 1n << 22n,
    D_MESSAGE: 1n << 23n,
} as const

type PL = {
    [K in keyof typeof AP]: {
        display: string
    }
}
export const PermList: PL = {
    MASTER: { display: 'تمام دسترسی ها' },

    V_USER: { display: 'نمایش کابران' },
    A_USER: { display: 'اضافه کردن کابران' },
    C_USER: { display: 'تغییر کابران' },
    D_USER: { display: 'حذف کابران' },

    V_RECORD: { display: 'نمایش فایل' },
    A_RECORD: { display: 'اضافه کردن فایل' },
    C_RECORD: { display: 'تغییر فایل' },
    D_RECORD: { display: 'حذف فایل' },

    V_BLOG: { display: 'نمایش مقاله' },
    A_BLOG: { display: 'اضافه کردن مقاله' },
    C_BLOG: { display: 'تغییر مقاله' },
    D_BLOG: { display: 'حذف مقاله' },

    V_GENERAL: { display: 'نمایش تنظیمات' },
    C_GENERAL: { display: 'تغییر تنظیمات' },

    V_MESSAGE: { display: 'نمایش پیام' },
    A_MESSAGE: { display: 'اضافه کردن پیام' },
    C_MESSAGE: { display: 'تغییر پیام' },
    D_MESSAGE: { display: 'حذف پیام' },
}

type UserPublic = {
    user_id: number
    name: string
    picture: string | null
}

export type UserAdmin = {
    perms: bigint
    perms_check(perms: bigint): boolean
}

export type UserExtra = {
    email: string
    phone: string | null
    token: string | null
    admin: string | null
}

export type UserModel = UserPublic & UserExtra & UserAdmin

const [user, setUser] = createStore<UserModel>({
    user_id: 0,
    name: '',
    email: '',
    picture: null,
    phone: null,
    admin: null,
    token: null,
    perms: 0n,
    perms_check(perms) {
        if (this.perms & AP.MASTER) {
            return true
        }

        return !!(this.perms & perms)
    },
})

const UserData: RouteDataFunc<never, Resource<UserModel>> = () => {
    const [data] = createResource(async () => {
        const res = await fetch('/api/user/')
        if (!res.ok) {
            location.replace('/login' + location.pathname)
            return user
        }

        const result: UserPublic & UserExtra = await res.json()
        let perms = 0n

        try {
            perms = BigInt(result.admin)
        } catch {}

        setUser({
            ...result,
            perms,
        })
        return user
    })

    return data
}

export { UserData, user, setUser }
export type UserDataType = typeof UserData
