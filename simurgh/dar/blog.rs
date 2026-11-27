use crate::models::{
    JsonStr,
    blog::{Blog, BlogData},
};
use sqlx::SqlitePool;

pub async fn blog_add_record_usages(blog: &Blog, pool: &SqlitePool) {
    let mut usages = Vec::with_capacity(blog.data.len());

    for bd in blog.data.iter() {
        match bd {
            BlogData::Image { record_id, .. }
            | BlogData::Audio { record_id, .. }
            | BlogData::Video { record_id, .. } => {
                if let Some(rid) = record_id {
                    usages.push(rid);
                }
            }
            BlogData::Break
            | BlogData::Empty
            | BlogData::Map { .. }
            | BlogData::Text { .. }
            | BlogData::List { .. }
            | BlogData::Heading { .. }
            | BlogData::CheckList { .. } => {}
        }
    }

    let usages = JsonStr(usages);

    let _ = sqlx::query!(
        "INSERT OR IGNORE INTO record_blog_usage (record, blog)
            SELECT r.id, ?2 FROM records AS r
            WHERE r.id IN (SELECT value FROM json_each(?1)) and r.project = ?3",
        usages,
        blog.id,
        blog.project
    )
    .execute(pool)
    .await;
}
