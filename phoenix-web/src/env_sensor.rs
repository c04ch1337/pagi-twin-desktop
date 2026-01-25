//! Techno-somatic environmental sensing.
//!
//! This module intentionally returns a small, stable surface-area payload that can be
//! attached to logs (e.g., grief events) without leaking identifying system details.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStress {
    /// 0..=100
    pub cpu_usage_percent: u8,
    /// Best-effort temperature reading (Celsius). Not available on all platforms.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature_c: Option<f32>,
}

impl Default for SystemStress {
    fn default() -> Self {
        Self {
            cpu_usage_percent: 0,
            temperature_c: None,
        }
    }
}

/// Polls the local system for a coarse stress signal.
///
/// Notes:
/// - CPU usage is a snapshot from `sysinfo` (best-effort, 0..100).
/// - Temperature is optional and may be `None` depending on OS/hardware.
pub fn get_system_stress() -> SystemStress {
    // CPU usage
    let cpu_usage_percent: u8 = {
        let mut sys = sysinfo::System::new_all();

        // `sysinfo` CPU usage becomes meaningful after refresh.
        sys.refresh_cpu();

        let cpus = sys.cpus();
        let usage_f32: f32 = if cpus.is_empty() {
            // Fallback to global_cpu_info if per-cpu list is empty (unlikely).
            sys.global_cpu_info().cpu_usage()
        } else {
            let sum: f32 = cpus.iter().map(|c| c.cpu_usage()).sum();
            sum / (cpus.len() as f32)
        };

        usage_f32
            .round()
            .clamp(0.0, 100.0) as u8
    };

    // Temperature (best-effort)
    let temperature_c: Option<f32> = {
        // Components API is separate from System in sysinfo.
        let components = sysinfo::Components::new_with_refreshed_list();
        let mut max_temp: Option<f32> = None;

        for c in components.iter() {
            let t = c.temperature();
            // sysinfo may report 0.0 when unknown; ignore that.
            if t.is_finite() && t > 0.0 {
                max_temp = Some(match max_temp {
                    Some(prev) => prev.max(t),
                    None => t,
                });
            }
        }

        max_temp
    };

    SystemStress {
        cpu_usage_percent,
        temperature_c,
    }
}

