use cercis::prelude::*;

use crate::models::blog::{BlogData, BlogTextGroup};

pub fn blog_render(data: &Vec<BlogData>) -> String {
    let elements = data.iter().map(|b| match b {
        BlogData::Text { dir, align, groups } => {
            rsx! {
                p {
                    style: "direction: {dir};text-align: {align}",
                    for g in groups {
                        Group { group: g }
                    }
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
        BlogData::Image { record_id, record_salt } => {
            rsx! {
                img {
                    src: "/record/r-{record_id}-{record_salt}",
                    loading: "lazy",
                    decode: "async",
                    draggable: false
                }
            }
        }
        _ => rsx!(),
    });

    rsx! { for e in elements { e } }.render()
}

#[component]
fn Group<'a>(group: &'a BlogTextGroup) -> Element {
    let style = group.style.css();
    let mut el = rsx! {
        span {
            style: "{style}",
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

    el
}
