// import { UserModel } from 'models'
import { createEffect, createRoot } from 'solid-js'

import { createStore } from 'solid-js/store'

import * as a from 'abi'

type SelfModel = {
    user: a.User
    loged_in: boolean
    fetch: boolean
}

async function get_default(): Promise<SelfModel> {
    try {
        let r = await a.api_user_get({ show_alert: false })
        if (r.err()) throw new Error()

        return {
            user: r.body,
            loged_in: true,
            fetch: false,
        }
    } catch {}

    return {
        loged_in: false,
        fetch: true,
        user: a.USER_DEF,
    }
}

export const [self, setSelf] = createStore(await get_default())

createRoot(() => {
    createEffect(() => {
        if (!self.fetch && self.loged_in) return

        get_default().then(result => setSelf(result))
    })
})
