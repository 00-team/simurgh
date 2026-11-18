use crate::AppErr;
use crate::models::ClientIp;
use std::collections::HashMap;
use tokio::sync::Mutex;

#[derive(Debug, Default)]
pub struct Toll {
    login: Mutex<HashMap<ClientIp, TollState<300, 30>>>,
    verification: Mutex<HashMap<ClientIp, TollState<300, 30>>>,
    // verify_password: Mutex<HashMap<ClientIp, TollState<600, 10>>>,
    // analytics: Mutex<HashMap<Gene, TollState<60, 30>>>,
    // eatery_tips: Mutex<HashMap<Gene, TollState<86400, 3>>>,
    // eatery_reviews: Mutex<HashMap<Gene, TollState<3600, 3>>>,
    // report: Mutex<HashMap<Gene, TollState<86400, 7>>>,
}

macro_rules! toll_ip {
    ($key:ident, $check:ident) => {
        pub async fn $check(&self, ip: &ClientIp) -> Result<(), AppErr> {
            let mut state = self.$key.lock().await;
            let Some(toll) = state.get_mut(ip) else {
                state.insert(*ip, TollState::default());
                return Ok(());
            };
            toll.take()
        }
    };
}

// macro_rules! toll_usr {
//     ($key:ident, $check:ident) => {
//         pub async fn $check(&self, usr: &Usr) -> Result<(), AppErr> {
//             let mut state = self.$key.lock().await;
//             let Some(toll) = state.get_mut(&usr.user.gene) else {
//                 state.insert(usr.user.gene, TollState::default());
//                 return Ok(());
//             };
//             toll.take()
//         }
//     };
// }

impl Toll {
    toll_ip!(login, login_check);
    toll_ip!(verification, verification_check);
    // toll_ip!(verify_password, verify_password_check);
    // toll_usr!(analytics, analytics);
    // toll_usr!(eatery_tips, eatery_tips);
    // toll_usr!(eatery_reviews, eatery_reviews);
    // toll_usr!(report, report);
}

#[derive(Debug)]
struct TollState<const EXPIRES: u64 = 600, const TRIES: u8 = 10> {
    expires: u64,
    tries: u8,
}

impl<const E: u64, const T: u8> Default for TollState<E, T> {
    fn default() -> Self {
        Self::new()
    }
}

impl<const EXPIRES: u64, const TRIES: u8> TollState<EXPIRES, TRIES> {
    pub fn new() -> Self {
        Self { expires: nest::sys_now() + EXPIRES, tries: 1 }
    }
    pub fn take(&mut self) -> Result<(), AppErr> {
        if cfg!(debug_assertions) {
            return Ok(());
        }

        let now = nest::sys_now();
        if self.expires < now {
            self.expires = now + EXPIRES;
            self.tries = 0;
            return Ok(());
        }

        if self.tries >= TRIES {
            return nest::err!(RateLimited, "too many tries");
        }

        self.tries += 1;
        Ok(())
    }
}
