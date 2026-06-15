//! Microsoft device-code OAuth — the same flow as `auth.ts` (consumers tenant,
//! the Refract Azure client id, `XboxLive.signin offline_access`). Two commands:
//! `auth_device_start` kicks it off; the frontend then polls `auth_device_poll`
//! every `interval` seconds until the user authorizes. (The XBL→XSTS→Minecraft
//! token chain is intentionally out of scope for this POC.)

use crate::secrets;
use serde::Serialize;
use serde_json::Value;

const CLIENT_ID: &str = "2ca3a07c-2fa0-433d-820a-e2f752f44415";
const SCOPE: &str = "XboxLive.signin offline_access";
const DEVICE_URL: &str = "https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode";
const TOKEN_URL: &str = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";

#[derive(Serialize)]
pub struct DeviceStart {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub interval: u64,
    pub expires_in: u64,
    pub message: String,
}

#[tauri::command]
pub async fn auth_device_start() -> Result<DeviceStart, String> {
    let res = reqwest::Client::new()
        .post(DEVICE_URL)
        .form(&[("client_id", CLIENT_ID), ("scope", SCOPE)])
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("device code request failed: HTTP {}", res.status()));
    }
    let v: Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(DeviceStart {
        device_code: v["device_code"].as_str().unwrap_or_default().to_string(),
        user_code: v["user_code"].as_str().unwrap_or_default().to_string(),
        verification_uri: v["verification_uri"].as_str().unwrap_or_default().to_string(),
        interval: v["interval"].as_u64().unwrap_or(5),
        expires_in: v["expires_in"].as_u64().unwrap_or(900),
        message: v["message"].as_str().unwrap_or_default().to_string(),
    })
}

// Tokens are NEVER returned to the frontend — on success they're written to the
// Stronghold vault here in Rust, and the command reports only signed-in status.
#[derive(Serialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum PollResult {
    Pending,
    Success,
}

#[tauri::command]
pub async fn auth_device_poll(device_code: String) -> Result<PollResult, String> {
    let res = reqwest::Client::new()
        .post(TOKEN_URL)
        .form(&[
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
            ("client_id", CLIENT_ID),
            ("device_code", device_code.as_str()),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let ok = res.status().is_success();
    let v: Value = res.json().await.map_err(|e| e.to_string())?;
    if ok {
        let access = v["access_token"].as_str().unwrap_or_default();
        secrets::store_secret("msa_access_token", access)?;
        if let Some(refresh) = v["refresh_token"].as_str() {
            secrets::store_secret("msa_refresh_token", refresh)?;
        }
        return Ok(PollResult::Success);
    }
    match v["error"].as_str().unwrap_or("") {
        "authorization_pending" | "slow_down" => Ok(PollResult::Pending),
        other => Err(format!("auth error: {}", if other.is_empty() { "unknown" } else { other })),
    }
}

/// Whether a signed-in MSA token is present in the vault (no token is exposed).
#[tauri::command]
pub fn auth_status() -> bool {
    secrets::has_secret("msa_access_token")
}
