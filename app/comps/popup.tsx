import { Component, createEffect } from 'solid-js'
import { produce } from 'solid-js/store'
import { DEFAULT_POPUP, popup, setPopup } from 'store/popup'

import './style/popup.scss'

export const Popup: Component = P => {
    createEffect(() => {
        console.log(popup)
    })
    return (
        <div class={`popup ${popup.type}`} classList={{ show: popup.show }}>
            <form
                onsubmit={e => {
                    e.preventDefault()
                    popup.onSubmit()
                    setPopup({ show: false })
                }}
                onreset={e => {
                    e.preventDefault()
                    setPopup(
                        produce(s => {
                            s = DEFAULT_POPUP
                            return s
                        })
                    )
                }}
                class='popup-wrapper'
            >
                {popup.Icon && <popup.Icon />}

                <h3 class='title'>{popup.title}</h3>
                <p class='title_smaller'>{popup.content}</p>

                <div class='ctas'>
                    <button type={'reset'} class='cta reject title_smaller'>
                        لغو
                    </button>
                    <button class='cta submit title_smaller' type='submit'>
                        تایید
                    </button>
                </div>
            </form>
        </div>
    )
}
