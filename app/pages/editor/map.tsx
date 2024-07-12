import { BlogImage, BlogMap } from 'models'
import { Component, onCleanup, onMount } from 'solid-js'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import './style/map.scss'
import { createStore } from 'solid-js/store'

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
    let map
    let currentMarker

    onMount(() => {
        map = L.map('map').setView([35.6997005458638, 51.337867620465936], 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        map.on('click', function (e) {
            if (currentMarker) {
                map.removeLayer(currentMarker)
            }
            currentMarker = L.marker(e.latlng).addTo(map)
        })

        onCleanup(() => {
            map.remove()
        })
    })
    return (
        <div class='block-map'>
            <h3 class='title'>نقطه روی نقشه رو انتخاب کنید</h3>
            <p class='title_smaller'>با کلیک کردن میتونید نقطه رو عوض کنید.</p>
            <div
                id='map'
                style={{ height: '500px', width: 'clamp(0px,100%,1500px)' }}
            ></div>
        </div>
    )
}
