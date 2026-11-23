use crate::state::SimurghDb;
use crate::state::VerificationState;
use actix_files as af;
use actix_multipart::form::MultipartFormConfig;
use actix_web::{
    App,  HttpServer, 
    middleware as mw,
    web::{Data, JsonConfig, PathConfig, QueryConfig, ServiceConfig, scope},
};
use config::Config;
use media::MediaConfig;
pub use models::AppErr;
use nest::NestError;

mod dar;
mod admin;
mod api;
mod config;
mod docs;
// mod general;
mod models;
mod state;
mod utils;
mod web;

// pub struct AppState {
//     pub sql: Pool<Sqlite>,
// }

fn config_app(app: &mut ServiceConfig) {
    if cfg!(debug_assertions) {
        app.service(af::Files::new("/static", "./static"));
        app.service(af::Files::new("/record", MediaConfig::RECORD_BASE));
        app.service(af::Files::new("/simurgh-ssrs", "./static/ssr/"));
        app.service(af::Files::new(
            "/simurgh-record",
            MediaConfig::RECORD_BASE,
        ));
    }

    // app.app_data(TempFileConfig::default().error_handler(|e, _| {
    //     actix_web::Error::from(nest::err!(Some(&e.to_string())))
    // }));
    // app.app_data(
    //     MultipartFormConfig::default().total_limit(209_715_200).error_handler(
    //         |e, _| {
    //             actix_web::Error::from(AppErrBadRequest(Some(&e.to_string())))
    //         },
    //     ),
    // );

    app.service(docs::openapi_json).service(docs::rapidoc);
    app.service(
        scope("/api")
            .service(api::user::router())
            .service(api::projects::router())
            .service(api::verification::verification)
            .service(scope("/admin").service(admin::projects::router())),
    );

    app.service(web::router());
}

// async fn init() -> SqlitePool {
//     dotenvy::from_path(".env").expect("could not read .env file");
//     pretty_env_logger::init();
//
//     let _ = std::fs::create_dir(Config::RECORD_DIR);
//     let cpt = SqliteConnectOptions::from_str("sqlite://main.db")
//         .expect("could not init sqlite connection options")
//         .journal_mode(SqliteJournalMode::Off);
//
//     SqlitePool::connect_with(cpt).await.expect("sqlite connection")
//     // let pool = SqlitePool::connect("sqlite://main.db").await.unwrap();
// }

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    log::set_logger(&nest::logger::MasterLogger).expect("logger");
    log::set_max_level(log::LevelFilter::Debug);

    Config::get();
    Config::create_dirs()?;

    macro_rules! errhand {
        ($ident:ident) => {
            $ident::default().error_handler(|e, _| {
                let code = NestError::BadRequest;
                AppErr {
                    status: code.status(),
                    code,
                    debug: Some(e.to_string()),
                }
                .into()
            })
        };
    }

    let data_pool = Data::new(SimurghDb::init().await);
    let data_toll = Data::new(state::Toll::default());
    let data_verification_state = Data::new(VerificationState::default());

    let server = HttpServer::new(move || {
        App::new()
            .wrap(mw::Logger::new("%s %r %Ts"))
            .app_data(data_toll.clone())
            .app_data(data_pool.clone())
            .app_data(data_verification_state.clone())
            .app_data(errhand!(PathConfig))
            .app_data(errhand!(QueryConfig))
            .app_data(errhand!(JsonConfig))
            .app_data(
                MultipartFormConfig::default()
                    .total_limit(200 * 1024 * 1024)
                    .memory_limit(200 * 1024 * 1024)
                    .error_handler(|e, _rq| {
                        log::error!("mpf: {e:#?}");
                        let code = NestError::BadRequest;
                        AppErr {
                            status: code.status(),
                            code,
                            debug: Some(e.to_string()),
                        }
                        .into()
                    }),
            )
            .configure(config_app)
        // .wrap(mw::from_fn(bridge::headx))
    });

    #[cfg(debug_assertions)]
    let server = server.bind(("0.0.0.0", Config::PORT)).unwrap().run();

    #[cfg(all(not(debug_assertions), unix))]
    let server = {
        use std::os::unix::fs::PermissionsExt;
        const PATH: &str = "/usr/share/nginx/socks/simurgh.sock";
        // let path = format!("{PATH}/{}", Config::get().nginx_sock);
        let server = server.bind_uds(&PATH).unwrap();
        let perms = std::fs::Permissions::from_mode(0o777);
        std::fs::set_permissions(&PATH, perms)?;
        server.run()
    };

    server.await
}
