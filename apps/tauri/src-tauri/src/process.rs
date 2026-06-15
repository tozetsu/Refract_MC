//! Spawn a child process and stream its output as events — the primitive the
//! Minecraft *launch* screen needs (spawn the game, stream stdout/stderr lines,
//! report exit). Mirrors how Electron's launcher streams logs over IPC, but via
//! Tauri events (`process://log`, `process://exit`).

use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::thread;
use tauri::{AppHandle, Emitter};

fn pump<R: std::io::Read + Send + 'static>(app: AppHandle, reader: R) {
    thread::spawn(move || {
        for line in BufReader::new(reader).lines().map_while(Result::ok) {
            let _ = app.emit("process://log", line);
        }
    });
}

/// Spawn `program args...`, streaming stdout+stderr as `process://log` events and
/// the exit code as `process://exit`. Returns the child PID immediately.
#[tauri::command]
pub fn process_run(app: AppHandle, program: String, args: Vec<String>) -> Result<u32, String> {
    let mut child = Command::new(&program)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to start `{program}`: {e}"))?;

    let pid = child.id();

    if let Some(out) = child.stdout.take() {
        pump(app.clone(), out);
    }
    if let Some(err) = child.stderr.take() {
        pump(app.clone(), err);
    }

    thread::spawn(move || {
        let code = child.wait().ok().and_then(|s| s.code()).unwrap_or(-1);
        let _ = app.emit("process://exit", code);
    });

    Ok(pid)
}
