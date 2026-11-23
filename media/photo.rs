use crate::record::{RecordPath, RecordPathKind, TempRecord};
use image::codecs::gif::GifDecoder;
use image::{AnimationDecoder, ImageDecoder, ImageReader};
use nest::NestErrorContext;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use webp::WebPMemory;

#[derive(Debug, Clone, Copy, Default)]
pub struct CropPercentage {
    pub top: f64,
    pub left: f64,
    pub bottom: f64,
    pub right: f64,
}

#[derive(Debug, Clone)]
pub enum MediaImage {
    Image(image::DynamicImage),
    Animated {
        width: u32,
        height: u32,
        frames: Vec<(image::DynamicImage, image::Delay)>,
    },
}

impl MediaImage {
    pub fn new(path: &Path) -> Result<Self, NestErrorContext> {
        let reader = ImageReader::open(path)?.with_guessed_format()?;

        let Some(fmt) = reader.format() else {
            return nest::err!(InvalidImage);
        };

        if fmt == image::ImageFormat::Gif {
            let Ok(gd) = GifDecoder::new(reader.into_inner()) else {
                return nest::err!(InvalidImage);
            };
            let (width, height) = gd.dimensions();
            let mut frames = Vec::with_capacity(100);
            for f in gd.into_frames() {
                match f {
                    Ok(f) => {
                        let d = f.delay();
                        let img =
                            image::DynamicImage::ImageRgba8(f.into_buffer());
                        frames.push((img, d));
                    }
                    Err(e) => log::error!("bad frame: {e:?}"),
                }
            }
            return Ok(Self::Animated { width, height, frames });
        }

        let Ok(image) = reader.decode() else {
            return nest::err!(InvalidImage);
        };
        Ok(Self::Image(image))
    }

    pub fn from_bytes(buf: &[u8]) -> Result<Self, NestErrorContext> {
        let Ok(fmt) = image::guess_format(buf) else {
            return nest::err!(InvalidImage);
        };

        let cc = std::io::Cursor::new(buf);
        let reader = ImageReader::with_format(cc, fmt);

        if fmt == image::ImageFormat::Gif {
            let Ok(gd) = GifDecoder::new(reader.into_inner()) else {
                return nest::err!(InvalidImage);
            };
            let (width, height) = gd.dimensions();
            let mut frames = Vec::with_capacity(100);
            for f in gd.into_frames() {
                match f {
                    Ok(f) => {
                        let d = f.delay();
                        let img =
                            image::DynamicImage::ImageRgba8(f.into_buffer());
                        frames.push((img, d));
                    }
                    Err(e) => log::error!("bad frame: {e:?}"),
                }
            }
            return Ok(Self::Animated { width, height, frames });
        }

        let Ok(image) = reader.decode() else {
            return nest::err!(InvalidImage);
        };
        Ok(Self::Image(image))
    }

    fn size(&self) -> (u32, u32) {
        match self {
            Self::Image(img) => (img.width(), img.height()),
            Self::Animated { width, height, .. } => (*width, *height),
        }
    }

    pub fn crop_pct(self, pct: Option<CropPercentage>) -> Self {
        let Some(pct) = pct else { return self };
        let (ogw, ogh) = self.size();
        let (ogw, ogh) = (ogw as f64, ogh as f64);

        let w = ogw * (1.0 - (pct.left + pct.right));
        let h = ogh * (1.0 - (pct.top + pct.bottom));
        let x = ogw * pct.left;
        let y = ogh * pct.top;

        self.crop(x as u32, y as u32, w as u32, h as u32)
    }

    pub fn crop(self, x: u32, y: u32, w: u32, h: u32) -> Self {
        match self {
            Self::Image(img) => Self::Image(img.crop_imm(x, y, w, h)),
            Self::Animated { frames, .. } => {
                let mut out = Vec::with_capacity(frames.len());
                for (img, d) in frames {
                    out.push((img.crop_imm(x, y, w, h), d));
                }

                Self::Animated { width: w, height: h, frames: out }
            }
        }
    }

    pub fn resize(self, w: u32, h: u32) -> Self {
        match self {
            Self::Image(img) => Self::Image(img.thumbnail(w, h)),
            Self::Animated { frames, width, height } => {
                Self::Animated { width, height, frames }
            }
        }
    }

    // pub fn add_watermark(mut self, put_watermark: bool) -> Self {
    //     let Self::Image(input) = &mut self else { return self };
    //     if !put_watermark {
    //         return self;
    //     }
    //     let mut rng = rand::rng();
    //     let (iw, ih) = (input.width(), input.height());
    //     let wm = Watermark::get().rand(iw, ih);
    //
    //     const PAD: u32 = Watermark::PAD;
    //     let (ww, wh) = (wm.width(), wm.height());
    //
    //     let (aw, ah) = (iw - ww - PAD, ih - wh - PAD);
    //
    //     let (x, y) = match rng.random_range(0u8..=3) {
    //         0 => (rng.random_range(PAD..aw), PAD),
    //         1 => (aw, rng.random_range(PAD..ah)),
    //         2 => (rng.random_range(PAD..aw), ah),
    //         3 => (PAD, rng.random_range(PAD..ah)),
    //         _ => unreachable!(),
    //     };
    //
    //     image::imageops::overlay(input, &wm, x as i64, y as i64);
    //     self
    // }

    pub fn webp_encode(self) -> Result<WebPMemory, NestErrorContext> {
        Ok(match self {
            Self::Image(img) => {
                let img: image::DynamicImage = img.into_rgba8().into();
                let Ok(e) = webp::Encoder::from_image(&img) else {
                    return nest::err!(EncodeWebpError);
                };
                e.encode(60.0)
            }

            Self::Animated { width, height, frames } => {
                let Ok(mut wconf) = webp::WebPConfig::new() else {
                    return nest::err!(ServerError, "webp config failed wtf?");
                };
                wconf.quality = 60.0;
                let mut anim = webp::AnimEncoder::new(width, height, &wconf);
                let mut ts = 0;
                for (img, d) in frames.iter() {
                    let Ok(af) = webp::AnimFrame::from_image(img, ts) else {
                        continue;
                    };
                    anim.add_frame(af);
                    ts += d.numer_denom_ms().0 as i32;
                }

                anim.encode()
            }
        })
    }
}

pub struct MediaPhoto {
    original: MediaImage,
    // variants: HashMap<String, MediaImage>,
    #[allow(dead_code)]
    file_name: Option<String>,
}

pub struct MediaPhotoInfo {
    pub width: u32,
    pub height: u32,
    pub size: u32,
}

impl MediaPhoto {
    fn from_image(original: MediaImage, file_name: Option<String>) -> Self {
        Self { original, file_name }
    }

    pub fn new(
        path: &Path, file_name: Option<String>,
    ) -> Result<Self, NestErrorContext> {
        Ok(Self::from_image(MediaImage::new(path)?, file_name))
    }

    pub fn from_bytes(buf: &[u8]) -> Result<Self, NestErrorContext> {
        Ok(Self::from_image(MediaImage::from_bytes(buf)?, None))
    }

    pub fn crop_pct(mut self, pct: Option<CropPercentage>) -> Self {
        self.original = self.original.crop_pct(pct);
        self
    }

    // pub fn crop(mut self, x: u32, y: u32, w: u32, h: u32) -> Self {
    //     self.original = self.original.crop(x, y, w, h);
    //     self
    // }

    pub fn resize(mut self, w: u32, h: u32) -> Self {
        self.original = self.original.resize(w, h);
        self
    }

    // pub fn add_watermark(mut self, put_watermark: bool) -> Self {
    //     self.original = self.original.add_watermark(put_watermark);
    //     self
    // }

    // pub fn add_variants(mut self, sizes: &[u32]) -> Self {
    //     for size in sizes {
    //         let key = format!("{size}px");
    //         if self.variants.contains_key(&key) {
    //             return self;
    //         }
    //
    //         let img = self.original.clone().resize(*size, *size);
    //         self.variants.insert(key, img);
    //     }
    //
    //     self
    // }

    pub fn encode(
        self,
    ) -> Result<(MediaTempPhotos, MediaPhotoInfo), NestErrorContext> {
        let (width, height) = self.original.size();

        let og_out = self.original.webp_encode()?;

        // let mut hash = md5::Context::new();
        // hash.consume(&og_out[..]);

        let info = MediaPhotoInfo { width, height, size: og_out.len() as u32 };
        // record.width = width;
        // record.height = height;
        // record.checksum = *hash.compute();
        // record.size = og_out.len() as u32;
        // record.duration = 0.0;
        // record.mime = RecordMime::ImageWebp.into();
        // record.server = 0;
        // record.name.set(&soil::utils::to_record_name(&self.file_name));

        let base_temp = TempRecord::new()?;

        fn save_img(
            data: WebPMemory, temp: TempRecord,
        ) -> std::io::Result<TempRecord> {
            let mut file = File::options()
                .write(true)
                .create(true)
                .truncate(true)
                .open(temp.path())?;

            file.write_all(&data)?;

            Ok(temp)
        }

        let temps = MediaTempPhotos::new(
            save_img(og_out, base_temp.clone())?,
            // self.variants.len(),
        );

        // for (key, img) in self.variants.into_iter() {
        //     let tmp = base_temp.join(&key);
        //     temps.add(key, save_img(img.webp_encode()?, tmp)?);
        // }

        Ok((temps, info))
    }
}

pub struct MediaTempPhotos {
    original: TempRecord,
    // variants: Vec<(String, TempRecord)>,
}

impl MediaTempPhotos {
    fn new(original: TempRecord) -> Self {
        Self { original }
    }

    // fn add(&mut self, key: String, var: TempRecord) {
    //     self.variants.push((key, var));
    // }

    pub fn save(
        self, project: i64, id: i64, salt: String,
    ) -> Result<RecordPath, NestErrorContext> {
        let path = RecordPath::new(id, salt, RecordPathKind::Webp, project);
        self.original.save(&path.as_path())?;
        // for (suffix, v) in self.variants {
        //     let pvrp = path.with_suffix(suffix);
        //     let _ = v.save(pvrp.);
        // }
        Ok(path)
    }
}
