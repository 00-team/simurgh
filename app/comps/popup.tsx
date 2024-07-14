import { Component, createEffect } from 'solid-js'
import { DEFAULT_POPUP, popup, setPopup } from 'store/popup'

import './style/popup.scss'

export const Popup: Component = P => {
    return (
        <div class={`popup ${popup.type}`} classList={{ show: popup.show }}>
            <form
                onsubmit={e => {
                    e.preventDefault()
                    popup.onSubmit()
                    setPopup({ ...DEFAULT_POPUP })
                }}
                onreset={e => {
                    e.preventDefault()
                    popup.onReject()
                    setPopup({ ...DEFAULT_POPUP })
                }}
                class='popup-wrapper'
            >
                {popup.Icon && <popup.Icon />}

                <h3 class='title'>{popup.title}</h3>
                <p class='title_smaller'>{popup.content}</p>

                <div class='ctas'>
                    <button class='cta submit title_smaller' type='submit'>
                        تایید
                    </button>
                    <button type={'reset'} class='cta reject title_smaller'>
                        لغو
                    </button>
                </div>
            </form>
        </div>
    )
}
