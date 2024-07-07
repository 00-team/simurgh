import { Component } from 'solid-js'
import { popup } from 'store/popup'

import './style/popup.scss'

export const Popup: Component = P => {
    return (
        <div class='popup' classList={{ show: popup.show }}>
            <form
                onsubmit={e => {
                    e.preventDefault()
                    popup.onSubmit()
                }}
                class='popup-wrapper'
            >
                {popup.Icon && <popup.Icon />}

                <h3 class='title'>{popup.title}</h3>
                <p class='title_smaller'>{popup.content}</p>

                <div class='ctas'>
                    <button class='cta submit title_small'>تایید</button>
                    <button
                        class='cta reject title_small'
                        onclick={() => {
                            popup.onReject()
                        }}
                    >
                        لغو
                    </button>
                </div>
            </form>
        </div>
    )
}
