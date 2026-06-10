SET NAMES utf8mb4;
SET time_zone = '+00:00';

DELETE FROM app_settings
WHERE setting_key IN ('game.teaching.corrective_action_due_days');

INSERT INTO app_settings (setting_key, setting_value, value_type)
VALUES
    ('game.scenario', 'small_physician_office', 'string'),
    ('game.audit.conditional_score', '65', 'integer'),
    ('game.audit.recommended_score', '85', 'integer'),
    ('game.registration.first_user_admin', 'true', 'boolean'),
    ('game.isms.asset_verified_weight', '3', 'integer'),
    ('game.isms.risk_treated_weight', '5', 'integer'),
    ('game.isms.evidence_ready_weight', '5', 'integer'),
    ('game.timeline.offline_event_minutes', '120', 'integer'),
    ('game.timeline.max_events_per_advance', '1', 'integer')
ON DUPLICATE KEY UPDATE
    setting_value = VALUES(setting_value),
    value_type = VALUES(value_type),
    updated_at = CURRENT_TIMESTAMP;
