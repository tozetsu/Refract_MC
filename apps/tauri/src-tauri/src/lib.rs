mod auth;
mod config;
mod download;
mod instances;
mod paths;
mod process;
mod secrets;

/// Tauri entry point. Each former Electron IPC handler becomes a `#[tauri::command]`
/// registered here; the renderer calls them via `invoke(...)`.
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            config::config_get,
            config::config_set,
            instances::instances_list,
            instances::get_instance_by_id,
            instances::create_instance,
            instances::update_instance,
            instances::delete_instance,
            download::download_demo,
            process::process_run,
            auth::auth_device_start,
            auth::auth_device_poll,
            auth::auth_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
