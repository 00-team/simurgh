pub struct MediaConfig;

impl MediaConfig {
    pub const RECORD_URL: &str = "/simurgh-record/";
    pub const RECORD_BASE: &str = "record";
    pub const RECORD_TMP: &str = "record/tmp";
    pub const RECORD_DEL: &str = "record/del";

    // pub const PHOTO_VARIANTS: &[u32] = &[100, 32];
    // pub const TOPIC_PHOTO_VARIANTS: &[u32] = &[100, 32];
    // pub const EATERY_PHOTO_VARIANTS: &[u32] = &[100, 32];
    // pub const COMMON_PHOTO_VARIANTS: &[&str] = &["100px", "32px"];

    pub fn create_dirs() -> std::io::Result<()> {
        use nest::utils::create_dir;

        create_dir(Self::RECORD_BASE)?;
        create_dir(Self::RECORD_TMP)?;
        create_dir(Self::RECORD_DEL)?;

        Ok(())
    }
}
