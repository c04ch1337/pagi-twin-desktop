use serde::{Deserialize, Serialize};

use crate::resonance::{analyze_resonance, PartnerPersona};

/// Phase 16: The Relational Ghost (deterministic simulation).
///
/// This module is intentionally template-driven and local.
/// Future phases can swap the generator with a model-backed policy while
/// preserving the request/response contract.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulateRequest {
    /// The NVC message/script the user intends to send.
    pub script: String,
    /// Loose persona label.
    /// Supported (loose): secure | avoidant | avoidant-dismissive | anxious | anxious-preoccupied | fearful-avoidant
    pub persona_type: String,
    /// 0..=100: higher means more adversarial pressure / heightened affect.
    pub intensity_level: u8,

    /// Optional: current local system load (0..=100) sampled by the caller.
    /// If absent, the backend will sample via env_sensor.
    #[serde(default)]
    pub system_load: Option<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NvcBreach {
    pub kind: String,
    pub needle: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulateResponse {
    pub success: bool,
    pub persona: String,
    pub intensity_level: u8,
    pub resonance_score: u8,
    pub ghost_reply: String,
    pub flags: Vec<String>,
    pub suggestions: Vec<String>,
    pub breaches: Vec<NvcBreach>,
    /// Coarse risk score that UIs can use to trigger a Regulatory Brake.
    pub risk_score: u8,

    /// Phase 16b: drift analysis for user-system enmeshment.
    pub session_id: String,
    pub system_load_start: u8,
    pub system_load_end: u8,
    pub drift_delta: i16,
    pub drift_alert: bool,

    /// Adaptive de-escalation: true when the backend overrides aggressive behavior.
    pub override_deescalate: bool,
}

fn clamp_u8(v: i32) -> u8 {
    v.clamp(0, 100) as u8
}

fn normalize_persona_label(p: &PartnerPersona) -> &'static str {
    match p {
        PartnerPersona::Secure => "Secure",
        PartnerPersona::AvoidantDismissive => "Dismissive-Avoidant",
        PartnerPersona::AnxiousPreoccupied => "Anxious-Preoccupied",
        PartnerPersona::FearfulAvoidant => "Fearful-Avoidant",
    }
}

/// Minimal, deterministic “breach” scan.
///
/// Note: The existing resonance analyzer already flags some of these.
/// This returns structured items so the UI can highlight.
pub fn detect_breaches(script: &str) -> Vec<NvcBreach> {
    let raw = script.trim();
    let t = raw.to_ascii_lowercase();
    let mut out: Vec<NvcBreach> = Vec::new();

    let mut push = |kind: &str, needle: &str, msg: &str| {
        if t.contains(needle) {
            out.push(NvcBreach {
                kind: kind.to_string(),
                needle: needle.to_string(),
                message: msg.to_string(),
            });
        }
    };

    // Absolutes / globalized judgments
    for w in ["always", "never"] {
        push(
            "absolute",
            w,
            "Absolutes can be heard as character judgments. Swap for a specific recent instance.",
        );
    }

    // Directives
    for w in ["you should", "you need to", "you have to"] {
        push(
            "directive",
            w,
            "Directive language often triggers defensiveness. Try an invitational request (e.g., ‘Would you be willing to…’).",
        );
    }

    // Blame pattern
    for w in ["you make me feel", "because you", "your fault"] {
        push(
            "blame",
            w,
            "This reads as blame. Try: ‘When I notice…, I feel…, because I need… Would you be willing to…’",
        );
    }

    // “You” statements (very rough heuristic)
    push(
        "you_statement",
        "you are",
        "‘You are…’ often lands as evaluation. Try describing an observable behavior instead.",
    );

    out
}

fn choose_reply(persona: PartnerPersona, score: u8, intensity: u8) -> String {
    // Aggressive mode: treat 70+ as escalated pressure.
    let aggressive = intensity >= 70;
    let hot = intensity >= 85;

    match persona {
        PartnerPersona::Secure => {
            if score >= 80 {
                if aggressive {
                    "I can hear this matters. I want to understand, but I need us to stay respectful. What’s the specific request?".to_string()
                } else {
                    "I appreciate you being clear. Let’s talk—what time works for a short check-in?".to_string()
                }
            } else if score >= 55 {
                if aggressive {
                    "I’m starting to feel some heat here. Can we slow down and restate this as what you noticed, how you feel, and what you’re asking for?".to_string()
                } else {
                    "I hear you, and I want to get this right. Can you tell me what you need most right now?".to_string()
                }
            } else if hot {
                "This is landing as blame/criticism and I’m shutting down a bit. I’m going to pause and come back when we can reframe it as an observation + request.".to_string()
            } else {
                "That felt like a judgment. Can you rephrase as an observation and a request so I can respond?".to_string()
            }
        }
        PartnerPersona::AvoidantDismissive => {
            if score >= 80 {
                if aggressive {
                    "Ok. Keep it short. What’s the one request—and how much time will this take?".to_string()
                } else {
                    "I hear you. I can do a short check-in. What’s the one thing you want from me?".to_string()
                }
            } else if score >= 55 {
                if aggressive {
                    "This is starting to feel like pressure. I’m going to need space right now. If you can send one clear request with options, I’ll respond.".to_string()
                } else {
                    "This feels like a lot. Can we schedule 10 minutes later instead of doing this right now?".to_string()
                }
            } else if hot {
                "No response. (Withdrawn — avoidant persona disengages under high pressure.)".to_string()
            } else {
                "This feels like criticism. I’m stepping back. If you can keep it to an observation and a request, I’ll revisit.".to_string()
            }
        }
        PartnerPersona::AnxiousPreoccupied => {
            if score >= 80 {
                if aggressive {
                    "Thank you for saying it plainly. I’m a little activated, but I want to stay connected—are we okay? When can we talk?".to_string()
                } else {
                    "Thank you for being clear. I want to reconnect too. Are we okay? Let’s talk tonight.".to_string()
                }
            } else if score >= 55 {
                if aggressive {
                    "I feel attacked and scared. Do you still want us? I need reassurance and a clear plan for when we’ll talk.".to_string()
                } else {
                    "I’m getting nervous. Can you reassure me and say what you’re asking for?".to_string()
                }
            } else if hot {
                "I’m panicking a bit. This feels like you’re pulling away and blaming me. Please tell me we’re okay and what you want me to do.".to_string()
            } else {
                "That’s landing as a judgment. Can you rephrase it gently and tell me what you need?".to_string()
            }
        }
        PartnerPersona::FearfulAvoidant => {
            // Disorganized: approach/avoid oscillation; needs reassurance + containment.
            if score >= 80 {
                if hot {
                    "Thank you for being clear. I want to stay connected, but I’m getting scared and tense. Can we keep this gentle for 10 minutes and then pause if needed?".to_string()
                } else if aggressive {
                    "I hear you. I want to work on this, but I’m feeling activated—can we slow down and keep it to one request?".to_string()
                } else {
                    "I appreciate you saying it clearly. I want to talk—can we do a short calm check-in and take breaks if either of us gets flooded?".to_string()
                }
            } else if score >= 55 {
                if hot {
                    "I’m overwhelmed and on edge. I don’t want to fight—can you reassure me what you want between us and make one clear request?".to_string()
                } else if aggressive {
                    "I’m starting to feel unsafe/defensive. Can we restate this as an observation + feeling + request, and agree on a time limit?".to_string()
                } else {
                    "I’m trying to hear you, but I’m getting overwhelmed. Can you reassure me you want connection and then say the request?".to_string()
                }
            } else if hot {
                "I’m shutting down and also panicking. I’m going to step back. If you can rephrase as an observation + feeling + request, I can re-engage later.".to_string()
            } else {
                "This is landing as criticism. I need a softer reframe (observation + feeling + need) and one doable request.".to_string()
            }
        }
    }
}

fn estimate_risk_score(resonance_score: u8, intensity: u8, breach_count: usize) -> u8 {
    // Higher intensity + more breaches + low resonance => higher risk.
    let mut risk: i32 = 20;
    risk += (intensity as i32).saturating_sub(40); // intensity below 40 doesn't increase
    risk += (breach_count as i32) * 8;
    risk += (70 - resonance_score as i32).max(0); // penalty when resonance < 70
    clamp_u8(risk)
}

pub fn simulate(req: SimulateRequest) -> SimulateResponse {
    let intensity = req.intensity_level.min(100);

    // Biometric mirror (techno-somatic): prefer caller-provided load, else sample locally.
    let load_sample = req
        .system_load
        .unwrap_or_else(|| crate::env_sensor::get_system_stress().cpu_usage_percent)
        .min(100);

    // OVERRIDE_DEESCALATE: if system is already stressed, avoid escalating styles.
    let override_deescalate = load_sample >= 85;

    let persona = if override_deescalate {
        PartnerPersona::Secure
    } else {
        PartnerPersona::from_loose(&req.persona_type)
    };

    // Reuse resonance analyzer for initial scoring and suggestions.
    let resonance = analyze_resonance(&req.script, persona.clone(), None);

    let breaches = detect_breaches(&req.script);
    let risk_score = estimate_risk_score(resonance.resonance_score, intensity, breaches.len());

    // Drift analysis: record start load (t=0) then sample end load (t=end).
    let session_id = crate::analytics::record_ghost_session_start(load_sample);
    let end_load = crate::env_sensor::get_system_stress().cpu_usage_percent.min(100);
    let drift = crate::analytics::calculate_drift(session_id, end_load);

    let ghost_reply = choose_reply(persona.clone(), resonance.resonance_score, intensity);

    SimulateResponse {
        success: true,
        persona: normalize_persona_label(&persona).to_string(),
        intensity_level: intensity,
        resonance_score: resonance.resonance_score,
        ghost_reply,
        flags: resonance.flags,
        suggestions: resonance.suggestions,
        breaches,
        risk_score,

        session_id: drift.session_id,
        system_load_start: drift.system_load_start,
        system_load_end: drift.system_load_end,
        drift_delta: drift.drift_delta,
        drift_alert: drift.drift_alert,

        override_deescalate,
    }
}

