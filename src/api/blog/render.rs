use cercis::prelude::*;

use crate::models::blog::{
    BlogCheckListItem, BlogData, BlogListItem, BlogTextGroup,
};

pub fn blog_render(data: &Vec<BlogData>) -> String {
    let elements = data.iter().map(|b| match b {
        BlogData::Text { dir, align, groups } => {
            rsx! {
                p {
                    style: "direction: {dir};text-align: {align}",
                    for g in groups { Group { group: g } }
                }
            }
        }
        BlogData::Heading { dir, align, level, content } => {
            let style = format!("direction: {dir};text-align: {align}");
            match level {
                1 => rsx! { h1 { style: "{style}", "{content}" } },
                2 => rsx! { h2 { style: "{style}", "{content}" } },
                3 => rsx! { h3 { style: "{style}", "{content}" } },
                4 => rsx! { h4 { style: "{style}", "{content}" } },
                5 => rsx! { h5 { style: "{style}", "{content}" } },
                6 => rsx! { h6 { style: "{style}", "{content}" } },
                _ => rsx! { h2 { style: "{style}", "{content}" } },
            }
        }
        BlogData::Image { url, alt, align, .. } => {
            rsx! {
                div {
                    style: "text-align: {align}",

                    img {
                        src: "{url}",
                        alt: "{alt}",
                        loading: "lazy",
                        decode: "async",
                        draggable: false,
                    }

                }
            }
        }
        BlogData::Break => rsx! { hr {} },
        BlogData::Empty => rsx!(),
        BlogData::Map { latitude, longitude, align } => rsx! {
            div {
                style: "text-align: {align}",

                iframe {
                    frameborder: "0",
                    src: "https://www.google.com/maps/embed/v1/place?q={latitude},{longitude}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"
                }
            }
        },
        BlogData::Audio { url, align, .. } => rsx! {
            div {
                style: "text-align: {align}",
                audio {
                    src: "{url}",
                    controls: true,
                }
            }
        },
        BlogData::Video { url, align, .. } => rsx! {
            div {
                style: "text-align: {align}",
                video {
                    src: "{url}",
                    controls: true,
                }
            }
        },
        BlogData::List { ordered, dir, align, items } => {
            let style = format!("direction: {dir};text-align: {align}");
            rsx! {
                BlogListOrder {
                    ordered: ordered, style: style,
                    for item in items {
                        ListItem { ordered: ordered, item: item }
                    }
                }
            }
        },
        BlogData::CheckList { ordered, items, align, dir } => {
            let style = format!("direction: {dir};text-align: {align}");
            rsx! {
                BlogListOrder {
                    ordered: ordered, style: style,
                    for item in items {
                        CheckListItem { ordered: ordered, item: item }
                    }
                }
            }
        },
    });

    rsx! { for e in elements { e } }.render()
}

#[component]
fn Group<'a>(group: &'a BlogTextGroup) -> Element {
    let mut el = rsx! {
        span {
            style: "{group.style.css()}",
            for (idx, line) in group.content.iter().enumerate() {
                "{line}"
                if idx != group.content.len() - 1 {
                    br {}
                }
            }
        }
    };

    if group.style.bold {
        el = rsx! { b { el } };
    }

    if group.style.italic {
        el = rsx! { i { el } };
    }

    if group.style.code {
        el = rsx! { code { el } };
    }

    if group.style.mark {
        el = rsx! { mark { el } };
    }

    if let Some(url) = &group.url {
        el = rsx! { a { href: "{url}", el } };
    }

    el
}

#[component]
fn BlogListOrder<'a>(
    ordered: &'a bool, style: Option<String>, children: Element<'a>,
) -> Element {
    if let Some(style) = style {
        return if **ordered {
            rsx! {ol { style: "{style}", children }}
        } else {
            rsx! {ul { style: "{style}", children }}
        };
    }

    rsx! { if **ordered { ol { children } } else { ul { children } } }
}

#[component]
fn ListItem<'a>(ordered: &'a bool, item: &'a BlogListItem) -> Element {
    let children = match &item.children {
        Some(c) if c.len() != 0 => Some(c),
        _ => None,
    };

    rsx! {
        li {
            "{item.text}"
            if let Some(children) = children {
                BlogListOrder {
                    ordered: ordered,
                    for child in children {
                        ListItem { ordered: ordered, item: child }
                    }
                }
            }
        }
    }
}

#[component]
fn CheckListItem<'a>(
    ordered: &'a bool, item: &'a BlogCheckListItem,
) -> Element {
    let children = match &item.children {
        Some(c) if c.len() != 0 => Some(c),
        _ => None,
    };

    rsx! {
        li {
            input { "type": "checkbox", checked: "{item.checked}" }
            "{item.text}"
            if let Some(children) = children {
                BlogListOrder {
                    ordered: ordered,
                    for item in children {
                        CheckListItem { ordered: ordered, item: item }
                    }
                }
            }
        }
    }
}
