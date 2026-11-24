import { A } from '@solidjs/router'
import './style/home.scss'

import { createSignal as create_signal, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import { self } from 'store'
import { LogoGood } from 'icons'

type NavLink = { label: string; href: string }
type Feature = { title: string; text: string }
type ContactChannel = { label: string; value: string; href: string }

// ---- things you will probably want to change -------------------------------

const docs_url = '/docs'
const login_url = '/login'
// const contact_email = 'dr@example.com'
const contact_telegram = '@i007c'

// -----------------------------------------------------------------------------

const nav_links: NavLink[] = [
    { label: 'درباره سیمرغ', href: '#about' },
    { label: 'تعرفه‌ها', href: '#pricing' },
    { label: 'مستندات', href: docs_url },
    { label: 'تماس با ما', href: '#contact' },
]

const features: Feature[] = [
    {
        title: 'یک پروژه برای هر اپ',
        text: 'برای هر اپ یک پروژه بسازید. دسته‌بندی‌ها، برچسب‌ها و مقاله‌های آن اپ همه در همان پروژه می‌مانند.',
    },
    {
        title: 'ویرایشگر اختصاصی',
        text: 'تصویر، ویدئو، صوت، جدول، لیست و چک‌لیست را در متن بگذارید. متن را گروه‌بندی کنید و به آن استایل و رنگ بدهید.',
    },
    {
        title: 'پیش‌نویس با هوش مصنوعی',
        text: 'یک پرامپت بنویسید و پیش‌نویس مقاله را بگیرید. بعد در همان ویرایشگر آن را کامل کنید.',
    },
    {
        title: 'API',
        text: 'مقاله‌ها، دسته‌بندی‌ها و برچسب‌های پروژه را با API در اپ خودتان نمایش دهید.',
    },
]

const plan_features: string[] = [
    'پروژه، دسته‌بندی، برچسب و مقاله',
    'ویرایشگر کامل با تصویر، ویدئو، صوت و جدول',
    'تولید پیش‌نویس با هوش مصنوعی',
    'دسترسی به API',
]

const toolbar_items: string[] = [
    'عنوان',
    'پررنگ',
    'رنگ',
    'تصویر',
    'ویدئو',
    'صوت',
    'جدول',
    'چک‌لیست',
]

const contact_channels: ContactChannel[] = [
    // { label: 'ایمیل', value: contact_email, href: 'mailto:' + contact_email },
    {
        label: 'تلگرام',
        value: contact_telegram,
        href: 'https://t.me/' + contact_telegram.replace('@', ''),
    },
]

const current_year = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
}).format(new Date())

function render_brand(): JSX.Element {
    return (
        <A class='smg-brand' href='/'>
            <span class='smg-brand-mark' aria-hidden='true'>
                <LogoGood />
            </span>
            <span class='smg-brand-name'>سیمرغ</span>
        </A>
    )
}

function render_navbar(): JSX.Element {
    const [menu_open, set_menu_open] = create_signal(false)

    return (
        <header class='smg-nav'>
            <div class='smg-container smg-nav-inner'>
                {render_brand()}

                <nav
                    id='smg-nav-links'
                    class={
                        'smg-nav-links' +
                        (menu_open() ? ' smg-nav-links-open' : '')
                    }
                    aria-label='منوی اصلی'
                >
                    <For each={nav_links}>
                        {link => (
                            <A
                                class='smg-nav-link'
                                href={link.href}
                                onclick={() => set_menu_open(false)}
                            >
                                {link.label}
                            </A>
                        )}
                    </For>
                </nav>

                <div class='smg-nav-actions'>
                    <LoginButton />
                    <button
                        type='button'
                        class='smg-button smg-button-secondary smg-menu-button'
                        aria-expanded={menu_open() ? 'true' : 'false'}
                        aria-controls='smg-nav-links'
                        on:click={() => set_menu_open(!menu_open())}
                    >
                        منو
                    </button>
                </div>
            </div>
        </header>
    )
}

function render_editor_preview(): JSX.Element {
    return (
        <div class='smg-editor' aria-hidden='true'>
            <div class='smg-editor-bar'>
                <For each={toolbar_items}>
                    {item => <span class='smg-editor-tool'>{item}</span>}
                </For>
            </div>

            <div class='smg-editor-body'>
                <p class='smg-editor-title'>دم‌آوری قهوه در خانه</p>
                <p class='smg-editor-text'>
                    برای یک فنجان خوب اول از{' '}
                    <mark class='smg-editor-mark'>نسبت قهوه به آب</mark> شروع
                    کنید. این نسبت را با چند بار امتحان به سلیقه خودتان نزدیک
                    کنید.
                </p>
                <ul class='smg-editor-checklist'>
                    <li class='smg-editor-check smg-editor-check-done'>
                        آسیاب کردن قهوه قبل از دم‌آوری
                    </li>
                    <li class='smg-editor-check smg-editor-check-done'>
                        گرم کردن آب تا حدود ۹۴ درجه
                    </li>
                    <li class='smg-editor-check'>آماده کردن فیلتر</li>
                </ul>
            </div>

            <div class='smg-editor-prompt'>
                <span class='smg-editor-prompt-text'>
                    یک مقدمه کوتاه برای این مقاله بنویس
                </span>
                <span class='smg-editor-prompt-action'>تولید</span>
            </div>
        </div>
    )
}

function render_hero(): JSX.Element {
    return (
        <section class='smg-hero'>
            <div class='smg-container smg-hero-inner'>
                <div class='smg-hero-text'>
                    <h1 class='smg-hero-title'>
                        وبلاگ اپ‌تان را در سیمرغ بنویسید و مدیریت کنید
                    </h1>
                    <p class='smg-hero-lead'>
                        برای هر اپ یک پروژه بسازید، دسته‌بندی و برچسب تعریف
                        کنید، مقاله‌ها را با ویرایشگر سیمرغ بنویسید و با API در
                        اپ خود نمایش دهید.
                    </p>
                    <div class='smg-hero-actions'>
                        <A
                            class='smg-button smg-button-primary'
                            href='#pricing'
                        >
                            مشاهده تعرفه‌ها
                        </A>
                        <A
                            class='smg-button smg-button-secondary'
                            href={docs_url}
                        >
                            مستندات
                        </A>
                    </div>
                </div>

                <div class='smg-hero-visual'>{render_editor_preview()}</div>
            </div>
        </section>
    )
}

function render_about(): JSX.Element {
    return (
        <section id='about' class='smg-section'>
            <div class='smg-container'>
                <div class='smg-section-head'>
                    <h2 class='smg-section-title'>درباره سیمرغ</h2>
                    <p class='smg-section-lead'>
                        سیمرغ جایی است که محتوای وبلاگ اپ شما نوشته و نگهداری
                        می‌شود. شما می‌نویسید و اپ شما از طریق API آن را نشان
                        می‌دهد.
                    </p>
                </div>

                <ul class='smg-features'>
                    <For each={features}>
                        {feature => (
                            <li class='smg-feature'>
                                <h3 class='smg-feature-title'>
                                    {feature.title}
                                </h3>
                                <p class='smg-feature-text'>{feature.text}</p>
                            </li>
                        )}
                    </For>
                </ul>
            </div>
        </section>
    )
}

function render_pricing(): JSX.Element {
    return (
        <section id='pricing' class='smg-section'>
            <div class='smg-container smg-pricing-inner'>
                <div class='smg-section-head'>
                    <h2 class='smg-section-title'>تعرفه‌ها</h2>
                    <p class='smg-section-lead'>
                        یک اشتراک ماهانه که همه بخش‌های سیمرغ را شامل می‌شود.
                    </p>
                </div>

                <div class='smg-plan'>
                    <p class='smg-plan-name'>اشتراک ماهانه</p>
                    <p class='smg-plan-price'>
                        <span class='smg-plan-amount'>۳٬۰۰۰٬۰۰۰</span>
                        <span class='smg-plan-unit'>تومان / ماه</span>
                    </p>

                    <ul class='smg-plan-features'>
                        <For each={plan_features}>
                            {item => <li class='smg-plan-feature'>{item}</li>}
                        </For>
                    </ul>

                    <LoginButton />
                </div>
            </div>
        </section>
    )
}

function LoginButton(): JSX.Element {
    return (
        <A
            class='smg-button smg-button-primary'
            href={self.loged_in ? '/projects/' : login_url}
        >
            <Show when={self.loged_in} fallback='ورود / ثبت‌نام'>
                داشبورد
            </Show>
        </A>
    )
}

function render_contact(): JSX.Element {
    return (
        <section id='contact' class='smg-section'>
            <div class='smg-container smg-contact-inner'>
                <div class='smg-section-head'>
                    <h2 class='smg-section-title'>تماس با ما</h2>
                    <p class='smg-section-lead'>
                        سؤال، پیشنهاد یا مشکل فنی دارید؟ به ما پیام بدهید.
                    </p>
                </div>

                <ul class='smg-contact-list'>
                    <For each={contact_channels}>
                        {channel => (
                            <li class='smg-contact-row'>
                                <span class='smg-contact-label'>
                                    {channel.label}
                                </span>
                                <A
                                    class='smg-contact-value'
                                    href={channel.href}
                                    target='_blank'
                                    dir='ltr'
                                >
                                    {channel.value}
                                </A>
                            </li>
                        )}
                    </For>
                </ul>
            </div>
        </section>
    )
}

function render_footer(): JSX.Element {
    return (
        <footer class='smg-footer'>
            <div class='smg-container smg-footer-inner'>
                <div class='smg-footer-about'>
                    {render_brand()}
                    <p class='smg-footer-text'>
                        ویرایشگر و API وبلاگ برای اپ شما
                    </p>
                </div>

                <nav class='smg-footer-links' aria-label='پیوندهای پایین صفحه'>
                    <For each={nav_links}>
                        {link => (
                            <A class='smg-footer-link' href={link.href}>
                                {link.label}
                            </A>
                        )}
                    </For>
                </nav>
            </div>

            <div class='smg-container'>
                <p class='smg-footer-copy'>© {current_year} سیمرغ</p>
            </div>
        </footer>
    )
}

export default function home_page(): JSX.Element {
    return (
        <div class='smg-page' dir='rtl' lang='fa'>
            {render_navbar()}
            <main>
                {render_hero()}
                {render_about()}
                {render_pricing()}
                {render_contact()}
            </main>
            {render_footer()}
        </div>
    )
}
