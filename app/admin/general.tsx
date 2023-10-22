import { PlusIcon } from '!/icon'
import './style/general.scss'

export default () => {
    return (
        <div class='general'>
            <div class='woc'>
                <div class='common-card'>
                    <img src='/static/image/home/hero.jpg' />
                    <input placeholder='عنوان' />
                    <textarea placeholder='توضیحات'></textarea>
                </div>
                <div class='add-card'>
                    <PlusIcon />
                </div>
            </div>
        </div>
    )
}
