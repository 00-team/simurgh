use utoipa::{
    openapi::{
        self,
        security::{ApiKey, ApiKeyValue, SecurityScheme},
        Components, Content, Response, SecurityRequirement,
    },
    Modify, OpenApi,
};

use crate::models::AppErr;

pub struct AddSecurity;

impl Modify for AddSecurity {
    fn modify(&self, openapi: &mut openapi::OpenApi) {
        if openapi.components.is_none() {
            openapi.components = Some(Components::new());
        }

        if let Some(schema) = openapi.components.as_mut() {
            schema.add_security_scheme(
                "auth",
                SecurityScheme::ApiKey(ApiKey::Header(ApiKeyValue::new(
                    "authorization",
                ))),
            )
        }

        openapi.security =
            Some(vec![SecurityRequirement::new("auth", [""; 0])]);
    }
}

pub struct UpdatePaths;

pub fn doc_add_prefix(
    openapi: &mut openapi::OpenApi, prefix: &str, update_tags: bool,
) {
    openapi.paths.paths = openapi
        .paths
        .paths
        .iter()
        .map(|(path, value)| {
            let path = prefix.to_string() + path;
            let mut value = value.to_owned();
            if update_tags {
                value.operations.iter_mut().for_each(|(_, op)| {
                    if let Some(tags) = &openapi.tags {
                        op.tags =
                            Some(tags.iter().map(|t| t.name.clone()).collect());
                    }
                });
            }

            value.operations.iter_mut().for_each(|(_, op)| {
                let mut response = Response::new("app err");
                response.content.insert(
                    "application/json".to_string(),
                    Content::new(openapi::RefOr::Ref(openapi::Ref::new(
                        "#/components/schemas/AppErr",
                    ))),
                );
                op.responses
                    .responses
                    .insert("xxx".to_string(), openapi::RefOr::T(response));
            });

            (path, value)
        })
        .collect();
}

impl Modify for UpdatePaths {
    fn modify(&self, openapi: &mut openapi::OpenApi) {
        let base_path = if let Some(s) = openapi.servers.as_mut() {
            if !s.is_empty() {
                s.remove(0).url
            } else {
                String::new()
            }
        } else {
            String::new()
        };

        doc_add_prefix(openapi, &base_path, true);
    }
}

#[derive(OpenApi)]
#[openapi(
    servers((url = "/")),
    modifiers(&AddSecurity),
    components(schemas(AppErr))
)]
pub struct ApiDoc;
