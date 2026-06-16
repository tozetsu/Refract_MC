//! Per-instance game data — worlds, crash reports, world backups. Filesystem
//! reads over the instance's game dir (port of the mc.worlds/crashReport/
//! deleteWorld/backupWorld IPC handlers). Screenshots (image thumbnails), the
//! server list (servers.dat NBT) and server ping need extra deps — separate step.

use crate::instances;
use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

/// Join `name` under `base`, rejecting anything that escapes it (path traversal).
fn safe_child(base: &Path, name: &str) -> Option<PathBuf> {
    if name.is_empty() || name.contains("..") || name.contains('/') || name.contains('\\') {
        return None;
    }
    let p = base.join(name);
    if p.starts_with(base) {
        Some(p)
    } else {
        None
    }
}

fn dir_size_kb(dir: &Path) -> u64 {
    let mut total = 0u64;
    if let Ok(entries) = fs::read_dir(dir) {
        for e in entries.flatten() {
            let p = e.path();
            if p.is_dir() {
                total += dir_size_kb(&p);
            } else if let Ok(m) = e.metadata() {
                total += m.len() / 1024;
            }
        }
    }
    total
}

fn mtime_ms(p: &Path) -> f64 {
    fs::metadata(p)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as f64)
        .unwrap_or(0.0)
}

#[derive(Serialize)]
pub struct World {
    name: String,
    #[serde(rename = "lastModified")]
    last_modified: f64,
    #[serde(rename = "sizeKb")]
    size_kb: u64,
}

#[tauri::command]
pub fn mc_worlds(instance_id: String) -> Vec<World> {
    let saves = instances::game_dir(&instance_id).join("saves");
    let mut out: Vec<World> = Vec::new();
    if let Ok(entries) = fs::read_dir(&saves) {
        for e in entries.flatten() {
            if !e.path().is_dir() {
                continue;
            }
            let path = e.path();
            let level = path.join("level.dat");
            let last_modified = mtime_ms(if level.exists() { &level } else { &path });
            out.push(World { name: e.file_name().to_string_lossy().to_string(), last_modified, size_kb: dir_size_kb(&path) });
        }
    }
    out.sort_by(|a, b| b.last_modified.total_cmp(&a.last_modified));
    out
}

#[tauri::command]
pub fn mc_delete_world(instance_id: String, world_name: String) -> Result<(), String> {
    let saves = instances::game_dir(&instance_id).join("saves");
    if let Some(p) = safe_child(&saves, &world_name) {
        if p.exists() {
            fs::remove_dir_all(&p).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Contents of the most recent crash report, or null if there are none.
#[tauri::command]
pub fn mc_crash_report(instance_id: String) -> Option<String> {
    let dir = instances::game_dir(&instance_id).join("crash-reports");
    let mut reports: Vec<(PathBuf, f64)> = fs::read_dir(&dir)
        .ok()?
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.extension().map(|x| x == "txt").unwrap_or(false))
        .map(|p| {
            let t = mtime_ms(&p);
            (p, t)
        })
        .collect();
    reports.sort_by(|a, b| b.1.total_cmp(&a.1));
    let latest = reports.first()?;
    fs::read_to_string(&latest.0).ok()
}

/// Zip a world folder to `dest_path` (chosen via a save dialog in the renderer),
/// off the main thread. Returns the path written.
#[tauri::command]
pub async fn mc_backup_world(instance_id: String, world_name: String, dest_path: String) -> Result<String, String> {
    let saves = instances::game_dir(&instance_id).join("saves");
    let world = safe_child(&saves, &world_name).ok_or("Invalid world name.")?;
    if !world.exists() {
        return Err("World not found.".into());
    }
    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let file = fs::File::create(&dest_path).map_err(|e| format!("Couldn't write {dest_path}: {e}"))?;
        let mut zip = zip::ZipWriter::new(file);
        let opts = zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated).large_file(true);
        zip_dir(&mut zip, &world, &world, opts)?;
        zip.finish().map_err(|e| e.to_string())?;
        Ok(dest_path)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn zip_dir(zip: &mut zip::ZipWriter<std::fs::File>, root: &Path, dir: &Path, opts: zip::write::SimpleFileOptions) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            zip_dir(zip, root, &path, opts)?;
        } else {
            let rel = path.strip_prefix(root).map_err(|e| e.to_string())?.to_string_lossy().replace('\\', "/");
            if let Ok(bytes) = fs::read(&path) {
                zip.start_file(rel, opts).map_err(|e| e.to_string())?;
                zip.write_all(&bytes).map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}
