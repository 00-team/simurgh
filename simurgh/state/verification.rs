use crate::{AppErr, models::user::VerificationAction};
use std::collections::HashMap;
use tokio::sync::Mutex;

struct VerifyData {
    codes: Vec<(String, u64)>,
    expires: u64,
    tries: u8,
}

type VerificationKey = (String, VerificationAction);

#[derive(Default)]
pub struct VerificationState {
    requests: Mutex<HashMap<VerificationKey, VerifyData>>,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct VerificationTimes {
    verify_expires: u64,
    last_code_expires: u64,
    next_resend: Option<u64>,
    #[serde(skip)]
    pub added: bool,
}

impl VerificationState {
    const CODE_EXPIRES: u64 = 3 * 60;
    const CODE_RESEND: u64 = 60;
    const VERIFY_EXPIRES: u64 = 10 * 60;
    const MAX_TRIES: u8 = 6;

    pub async fn add_code(
        &self, key: VerificationKey, code: String,
    ) -> Result<VerificationTimes, AppErr> {
        let mut r = self.requests.lock().await;
        let now = nest::sys_now();

        r.retain(|_, d| d.expires > now);
        let Some(d) = r.get_mut(&key) else {
            r.insert(
                key,
                VerifyData {
                    codes: vec![(code, now + Self::CODE_EXPIRES)],
                    expires: now + Self::VERIFY_EXPIRES,
                    tries: 0,
                },
            );

            return Ok(VerificationTimes {
                verify_expires: Self::VERIFY_EXPIRES,
                last_code_expires: Self::CODE_EXPIRES,
                next_resend: Some(Self::CODE_RESEND),
                added: true,
            });
        };

        if d.tries > Self::MAX_TRIES {
            return nest::err!(RateLimited);
        }

        if d.codes.len() >= 3 {
            let lc = d.codes.last().unwrap().1;
            return Ok(VerificationTimes {
                verify_expires: d.expires.saturating_sub(now),
                last_code_expires: lc.saturating_sub(now),
                next_resend: None,
                added: false,
            });
        }

        if let Some((_, lc)) = d.codes.last() {
            let ce = lc.saturating_sub(now);
            let rce = Self::CODE_EXPIRES.saturating_sub(ce);
            if rce < Self::CODE_RESEND {
                return Ok(VerificationTimes {
                    verify_expires: d.expires.saturating_sub(now),
                    last_code_expires: ce,
                    next_resend: Some(Self::CODE_RESEND.saturating_sub(rce)),
                    added: false,
                });
            }
        }

        d.codes.push((code, now + Self::CODE_EXPIRES));

        Ok(VerificationTimes {
            verify_expires: d.expires.saturating_sub(now),
            last_code_expires: Self::CODE_EXPIRES,
            added: true,
            next_resend: if d.codes.len() >= 3 {
                None
            } else {
                Some(Self::CODE_RESEND)
            },
        })
    }

    pub async fn verify(
        &self, key: &VerificationKey, #[allow(unused)] code: &str,
    ) -> Result<(), AppErr> {
        let mut r = self.requests.lock().await;
        let now = nest::sys_now();

        r.retain(|_, d| d.expires > now);

        let Some(d) = r.get_mut(key) else {
            return nest::err!(BadRequest, "bad verification");
        };

        if d.tries > Self::MAX_TRIES {
            return nest::err!(RateLimited);
        }

        d.tries += 1;

        #[cfg(not(debug_assertions))]
        if !d.codes.iter().any(|(c, e)| *e > now && c == code) {
            return nest::err!(BadRequest, "invalid code");
        }

        // TODO: we might get some kind of attack
        // like the attacker requests a sms send the correct code thus
        // removing the state and then again requests more sms
        // so not removing the session might be better
        // but also if an actual user logs in their phone and wants
        // to login another device with the same phone number that would be
        // an issue
        r.remove(key);

        Ok(())
    }
}
