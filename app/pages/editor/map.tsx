import { BlogMap } from 'models'
import { Component, createEffect, onCleanup, onMount, Show } from 'solid-js'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { SaveIcon } from 'icons'
import { createStore } from 'solid-js/store'
import './style/map.scss'
import { setPopup } from 'store/popup'

type Props = {
    idx: number
    block: BlogMap
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

export const EditorMapBlock: Component<Props> = P => {
    return (
        <div class='block-map'>
            <Show
                when={P.block.latitude !== 0 && P.block.longitude !== 0}
                fallback={<MapNewMarker {...P} />}
            >
                <MapWIthMarker {...P} />
            </Show>
        </div>
    )
}

const MapWIthMarker: Component<Props> = P => {
    let map

    onMount(() => {
        map = L.map('map').setView([P.block.latitude, P.block.longitude], 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        L.marker([P.block.latitude, P.block.longitude]).addTo(map)

        onCleanup(() => {
            map.remove()
        })
    })
    return (
        <div
            id='map'
            style={{ height: '500px', width: 'clamp(0px,100%,1500px)' }}
        ></div>
    )
}

const MapNewMarker: Component<Props> = () => {
    const [marker, setMarker] = createStore({ lat: '', lng: '' })
    let map
    let oldMarker

    onMount(() => {
        map = L.map('map').setView([35.6997005458638, 51.337867620465936], 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        map.on('click', function (e) {
            if (oldMarker) {
                map.removeLayer(oldMarker)
            }
            setMarker(e.latlng)
        })

        createEffect(() => {
            if (oldMarker) {
                map.removeLayer(oldMarker)
            }
            oldMarker = L.marker(marker).addTo(map)
        })

        onCleanup(() => {
            map.remove()
        })
    })
    return (
        <>
            <h3 class='title'>نقطه روی نقشه رو انتخاب کنید</h3>
            <p class='title_smaller'>با کلیک کردن میتونید نقطه رو عوض کنید.</p>
            <button
                class='cta save title_smaller'
                classList={{ disable: marker.lat === '' && marker.lng === '' }}
                onclick={() => {
                    setPopup({
                        show: true,
                        content: 'از ذخیره نقطه مطمعنید؟',
                        Icon: SaveIcon,
                        title: 'ذخیره نقشه',
                        type: 'info',
                    })
                }}
            >
                <SaveIcon />
                ذخیر نقطه
            </button>
            <div
                id='map'
                style={{ height: '500px', width: 'clamp(0px,100%,1500px)' }}
            ></div>
        </>
    )
}
