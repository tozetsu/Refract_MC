//! Rust port of `listInstances()` from
//! `apps/renderer/src/main/services/instance-store.ts`.
//!
//! Scans `<data>/instances/*/instance.json`, then any custom-path instances in
//! `<data>/instance-registry.json`, deduped by id and sorted by lastPlayed
//! (falling back to createdAt) descending — identical to the Electron version.

use crate::paths;
use serde::Deserialize;
use serde_json::Value;
use std::collections::HashSet;
use std::fs;
use std::path::Path;

#[derive(Deserialize)]
struct RegistryEntry {
    id: String,
    path: String,
}

fn read_instance(json_path: &Path) -> Option<Value> {
    fs::read_to_string(json_path)
        .ok()
        .and_then(|s| serde_json::from_str::<Value>(&s).ok())
}

fn sort_key(inst: &Value) -> String {
    inst.get("lastPlayed")
        .and_then(Value::as_str)
        .or_else(|| inst.get("createdAt").and_then(Value::as_str))
        .unwrap_or("")
        .to_string()
}

#[tauri::command]
pub fn instances_list() -> Result<Vec<Value>, String> {
    let mut seen: HashSet<String> = HashSet::new();
    let mut out: Vec<Value> = Vec::new();

    // Default managed instances.
    let dir = paths::instances_dir();
    if dir.exists() {
        if let Ok(entries) = fs::read_dir(&dir) {
            for entry in entries.flatten() {
                if !entry.path().is_dir() {
                    continue;
                }
                if let Some(inst) = read_instance(&entry.path().join("instance.json")) {
                    if let Some(id) = inst.get("id").and_then(Value::as_str) {
                        seen.insert(id.to_string());
                        out.push(inst);
                    }
                }
            }
        }
    }

    // Custom-path instances from the registry.
    let reg_path = paths::data_dir().join("instance-registry.json");
    if let Ok(text) = fs::read_to_string(&reg_path) {
        if let Ok(entries) = serde_json::from_str::<Vec<RegistryEntry>>(&text) {
            for e in entries {
                if seen.contains(&e.id) {
                    continue;
                }
                if let Some(inst) = read_instance(&Path::new(&e.path).join("instance.json")) {
                    let id = inst
                        .get("id")
                        .and_then(Value::as_str)
                        .unwrap_or(&e.id)
                        .to_string();
                    seen.insert(id);
                    out.push(inst);
                }
            }
        }
    }

    out.sort_by(|a, b| sort_key(b).cmp(&sort_key(a)));
    Ok(out)
}
