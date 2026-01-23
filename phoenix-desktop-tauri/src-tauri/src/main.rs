// Tauri backend (minimal scaffold)

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use multi_modal_recording::MultiModalRecorder;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{
    AppHandle, Manager, State,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState},
};
use tokio::sync::Mutex;

#[derive(Default)]
struct RecorderState {
    inner: Arc<Mutex<MultiModalRecorder>>,
}

#[derive(Serialize)]
struct RecordResult {
    path: String,
}

#[tauri::command]
async fn record_audio(state: State<'_, RecorderState>, duration_secs: u64) -> Result<RecordResult, String> {
    let rec = state.inner.lock().await.clone();
    let rec = rec.clone_with_modes(true, false);
    let p = rec.start_on_demand(duration_secs).await.map_err(|e| e.to_string())?;
    Ok(RecordResult { path: p.display().to_string() })
}

#[tauri::command]
async fn record_video(state: State<'_, RecorderState>, duration_secs: u64) -> Result<RecordResult, String> {
    let rec = state.inner.lock().await.clone();
    let rec = rec.clone_with_modes(false, true);
    let p = rec.start_on_demand(duration_secs).await.map_err(|e| e.to_string())?;
    Ok(RecordResult { path: p.display().to_string() })
}

#[tauri::command]
async fn record_av(state: State<'_, RecorderState>, duration_secs: u64) -> Result<RecordResult, String> {
    let rec = state.inner.lock().await.clone();
    let rec = rec.clone_with_modes(true, true);
    let p = rec.start_on_demand(duration_secs).await.map_err(|e| e.to_string())?;
    Ok(RecordResult { path: p.display().to_string() })
}

#[tauri::command]
async fn schedule_recording(state: State<'_, RecorderState>, cron_expr: String, purpose: String) -> Result<(), String> {
    let rec = state.inner.lock().await.clone();
    rec.schedule_recording(&cron_expr, &purpose).await;
    Ok(())
}

#[tauri::command]
async fn set_always_listening(state: State<'_, RecorderState>, enabled: bool) -> Result<(), String> {
    let rec = state.inner.lock().await.clone();
    if enabled {
        rec.start_always_listening().await;
    } else {
        rec.stop_listening();
    }
    Ok(())
}

#[tauri::command]
async fn enroll_voice(state: State<'_, RecorderState>, samples: Vec<String>) -> Result<(), String> {
    let samples = samples.into_iter().map(PathBuf::from).collect::<Vec<_>>();
    let mut rec = state.inner.lock().await;
    rec.enroll_user_voice(samples).map_err(|e| e.to_string())
}

#[tauri::command]
async fn enroll_face(state: State<'_, RecorderState>, images: Vec<String>) -> Result<(), String> {
    let images = images.into_iter().map(PathBuf::from).collect::<Vec<_>>();
    let mut rec = state.inner.lock().await;
    rec.enroll_user_face(images).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_last_recording(state: State<'_, RecorderState>) -> Result<bool, String> {
    let rec = state.inner.lock().await.clone();
    rec.delete_last_recording().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn clear_all_recordings(state: State<'_, RecorderState>) -> Result<u64, String> {
    let rec = state.inner.lock().await.clone();
    rec.clear_all_recordings().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn recognition_status(_state: State<'_, RecorderState>) -> Result<String, String> {
    // Placeholder until live preview + recognition pipeline is wired.
    Ok("I see you, Dad ❤️".to_string())
}

#[tauri::command]
async fn emotion_status(state: State<'_, RecorderState>) -> Result<String, String> {
    let rec = state.inner.lock().await.clone();
    let result = match rec.last_emotion().await {
        Some(s) => format!(
            "Dad is feeling: {:?} ({:.0}%) ❤️",
            s.primary_emotion,
            s.confidence * 100.0
        ),
        None => "Dad is feeling: Neutral".to_string(),
    };
    Ok(result)
}

#[tauri::command]
async fn emotion_history(state: State<'_, RecorderState>, max: usize) -> Result<Vec<String>, String> {
    let rec = state.inner.lock().await.clone();
    Ok(rec.emotional_moments_recent(max))
}

#[tauri::command]
fn send_notification(
    _app: AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    // Tauri v2 notification API - requires notification permission in capabilities
    // For now, return success - notifications will be handled via frontend
    println!("Notification: {} - {}", title, body);
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(RecorderState {
            inner: Arc::new(Mutex::new(MultiModalRecorder::from_env())),
        })
        .setup(|app| {
            // Create system tray menu
            let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide Window", true, None::<&str>)?;
            let status = MenuItem::with_id(app, "status", "Status: Active", false, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[
                &status,
                &PredefinedMenuItem::separator(app)?,
                &show,
                &hide,
                &PredefinedMenuItem::separator(app)?,
                &quit,
            ])?;
            
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Sola AGI - v1.0.1")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            record_audio,
            record_video,
            record_av,
            schedule_recording,
            set_always_listening,
            enroll_voice,
            enroll_face,
            delete_last_recording,
            clear_all_recordings,
            recognition_status,
            emotion_status,
            emotion_history,
            send_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

