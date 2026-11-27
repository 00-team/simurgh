use std::path::{Path, PathBuf};
use std::time::SystemTime;

use nest::NestErrorContext;

use crate::MediaConfig;

#[derive(Debug, Clone)]
pub struct TempRecord {
    path: PathBuf,
}

impl TempRecord {
    pub fn path(&self) -> &PathBuf {
        &self.path
    }

    pub fn save(&self, path: &Path) -> Result<(), NestErrorContext> {
        std::fs::rename(&self.path, path)?;
        Ok(())
    }

    pub fn join(&self, key: &str) -> Self {
        Self { path: self.path.join(key) }
    }

    // pub fn discard(self) {
    //     let _ = std::fs::remove_file(self.path);
    // }

    pub fn new() -> Result<Self, NestErrorContext> {
        let mut tri = 0u8;
        loop {
            let dur = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let idx: u64 = rand::random();
            let name = format!("{dur}-{idx}");
            let path = Path::new(MediaConfig::RECORD_TMP).join(name);
            if !path.exists() {
                return Ok(Self { path });
            }
            tri += 1;
            if tri > 200 {
                return nest::err!(
                    ServerError,
                    "cannot find any non-used paths for TempRecord"
                );
            }
        }
    }

    // pub fn from_temp(
    //     temp: &mut TempFile, dir: &'static str, record: &mut Record,
    // ) -> io::Result<Self> {
    //     let mut hash = md5::Context::new();
    //     let mut buf = [0u8; BLOCK_SIZE];
    //     record.size = 0;
    //     loop {
    //         let rs = temp.file.read(&mut buf)?;
    //         hash.consume(buf);
    //         // file.write_all(&buf)?;
    //         if record.size == 0 {
    //             if let Some(ty) = infer::get(&buf) {
    //                 record.mime = RecordMime::from_mime(ty.mime_type()) as u8;
    //             }
    //         }
    //         record.size += rs as u32;
    //
    //         if rs < BLOCK_SIZE {
    //             break;
    //         }
    //     }
    //     record.checksum = *hash.compute();
    //     record.duration = 0.0;
    //     record.server = 0;
    //
    //     Ok(Self { path: temp.file.path().to_path_buf(), dir })
    // }

    // pub fn from_copy(from: &Gene) -> io::Result<Self> {
    //     let name = from.as_hex();
    //     let from = Path::new(MediaConfig::RECORD_DIR).join(&name);
    //     let to = Path::new(MediaConfig::RECORD_TMP).join(&name);
    //     std::fs::copy(from, &to)?;
    //     Ok(Self { path: to })
    // }
}

pub struct RecordPath {
    id: i64,
    salt: String,
    kind: RecordPathKind,
    project: i64,
    suffix: Option<String>,
}

impl RecordPath {
    pub fn new(
        id: i64, salt: String, kind: RecordPathKind, project: i64,
    ) -> Self {
        assert!(salt.len() >= 4);

        Self { id, salt, kind, project, suffix: None }
    }

    pub fn with_suffix(&self, suffix: String) -> Self {
        Self {
            id: self.id,
            salt: self.salt.clone(),
            project: self.project,
            kind: self.kind,
            suffix: Some(suffix),
        }
    }

    pub fn delete(&self) {
        let del = Path::new(MediaConfig::RECORD_DEL).join(format!(
            "{}-{}",
            self.project,
            self.name()
        ));
        let _ = std::fs::rename(self.as_path(), del);
    }

    fn name(&self) -> String {
        let mut name = format!("{}-{}", self.id, self.salt);
        if let Some(suffix) = &self.suffix {
            name.push('_');
            name.push_str(suffix);
        }
        name.push_str(self.kind.suffix());
        name
    }

    pub fn as_url(&self) -> String {
        let mut url = String::from(MediaConfig::RECORD_URL);
        url.push_str(&format!("{:04x}", self.project));
        url.push_str(&self.salt[..2]);
        url.push('/');

        let name = self.name();
        url.push_str(&name);

        if self.kind == RecordPathKind::M3u8 {
            url.push_str("/ostad.m3u8");
        }

        url
    }

    pub fn as_path(&self) -> PathBuf {
        let p = self.project.to_string();
        let dir =
            Path::new(MediaConfig::RECORD_BASE).join(&p).join(&self.salt[..2]);
        let _ = std::fs::create_dir_all(&dir);

        let name = self.name();
        let path = dir.join(name);

        if self.kind == RecordPathKind::M3u8 {
            let _ = std::fs::create_dir_all(&path);
        }

        path
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum RecordPathKind {
    Webp,
    Mp4,
    M3u8,
    Opus,
}

impl RecordPathKind {
    pub fn suffix(&self) -> &'static str {
        match self {
            Self::Webp => ".webp",
            Self::Mp4 => ".mp4",
            Self::M3u8 => "-m3u8",
            Self::Opus => ".opus",
        }
    }
}
