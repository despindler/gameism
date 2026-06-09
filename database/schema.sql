SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'player',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_states (
    user_id INT UNSIGNED NOT NULL,
    scenario_key VARCHAR(80) NOT NULL,
    organization_name VARCHAR(160) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_player_states_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS office_objects (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    object_key VARCHAR(80) NOT NULL,
    object_type VARCHAR(60) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    state VARCHAR(40) NOT NULL DEFAULT 'needs_attention',
    is_blocking TINYINT(1) NOT NULL DEFAULT 0,
    is_clickable TINYINT(1) NOT NULL DEFAULT 1,
    sort_layer INT NOT NULL DEFAULT 0,
    metadata_json JSON NOT NULL,
    config_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_office_objects_user_key (user_id, object_key),
    KEY idx_office_objects_user_layer (user_id, sort_layer),
    CONSTRAINT fk_office_objects_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_reports (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    status VARCHAR(60) NOT NULL,
    score_json JSON NOT NULL,
    findings_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_reports_user_created (user_id, created_at),
    CONSTRAINT fk_audit_reports_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_inventory_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    asset_key VARCHAR(80) NOT NULL,
    object_key VARCHAR(80) NULL,
    name VARCHAR(160) NOT NULL,
    asset_type VARCHAR(80) NOT NULL,
    owner VARCHAR(120) NOT NULL,
    information_classification VARCHAR(80) NOT NULL,
    criticality VARCHAR(20) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'draft',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_asset_inventory_user_key (user_id, asset_key),
    KEY idx_asset_inventory_user_status (user_id, status),
    CONSTRAINT fk_asset_inventory_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS risk_register_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    risk_key VARCHAR(80) NOT NULL,
    object_key VARCHAR(80) NULL,
    title VARCHAR(180) NOT NULL,
    owner VARCHAR(120) NOT NULL,
    likelihood TINYINT UNSIGNED NOT NULL,
    impact TINYINT UNSIGNED NOT NULL,
    treatment_status VARCHAR(40) NOT NULL DEFAULT 'identified',
    treatment_summary TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_risk_register_user_key (user_id, risk_key),
    KEY idx_risk_register_user_status (user_id, treatment_status),
    CONSTRAINT fk_risk_register_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evidence_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    evidence_key VARCHAR(80) NOT NULL,
    object_key VARCHAR(80) NULL,
    title VARCHAR(180) NOT NULL,
    evidence_type VARCHAR(80) NOT NULL,
    expected_evidence TEXT NOT NULL,
    owner VARCHAR(120) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'missing',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_evidence_user_key (user_id, evidence_key),
    KEY idx_evidence_user_status (user_id, status),
    CONSTRAINT fk_evidence_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incident_events (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    incident_key VARCHAR(80) NOT NULL,
    object_key VARCHAR(80) NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'available',
    trigger_text TEXT NOT NULL,
    lesson_text TEXT NOT NULL,
    required_controls_json JSON NOT NULL,
    required_evidence_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL DEFAULT NULL,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_incident_events_user_key (user_id, incident_key),
    KEY idx_incident_events_user_status (user_id, status),
    CONSTRAINT fk_incident_events_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS corrective_actions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    action_key VARCHAR(120) NOT NULL,
    source_type VARCHAR(40) NOT NULL,
    source_key VARCHAR(120) NOT NULL,
    object_key VARCHAR(80) NULL,
    title VARCHAR(220) NOT NULL,
    owner VARCHAR(120) NOT NULL,
    due_days INT UNSIGNED NOT NULL DEFAULT 14,
    status VARCHAR(40) NOT NULL DEFAULT 'open',
    verification_status VARCHAR(40) NOT NULL DEFAULT 'not_checked',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_corrective_actions_user_key (user_id, action_key),
    KEY idx_corrective_actions_user_status (user_id, status),
    CONSTRAINT fk_corrective_actions_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS internal_audit_reports (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    scope VARCHAR(220) NOT NULL,
    status VARCHAR(60) NOT NULL,
    score_json JSON NOT NULL,
    findings_json JSON NOT NULL,
    corrective_actions_created INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_internal_audit_reports_user_created (user_id, created_at),
    CONSTRAINT fk_internal_audit_reports_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(120) NOT NULL,
    setting_value TEXT NOT NULL,
    value_type VARCHAR(40) NOT NULL DEFAULT 'string',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
