mod auth;
mod config;
mod download;
mod instances;
mod paths;
mod process;

/// Tauri entry point. Each former Electron IPC handler becomes a `#[tauri::command]`
/// registered here; the renderer calls them via `invoke(...)`.
pub fn run() {
    tauri::Builder::default()
        // Stronghold: encrypted vault for tokens (replaces Electron's safeStorage).
        // The password the JS side passes is hashed here into the vault key.
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                use sha2::{Digest, Sha256};
                let mut hasher = Sha256::new();
                hasher.update(password.as_bytes());
                hasher.finalize().to_vec()
            })
            .build(),
        )
        .invoke_handler(tauri::generate_handler![
            config::config_get,
            config::config_set,
            instances::instances_list,
            download::download_demo,
            process::process_run,
            auth::auth_device_start,
            auth::auth_device_poll,
            auth::vault_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
