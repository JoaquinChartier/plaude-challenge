#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env"
touch "$ENV_FILE"
set -a
# The file is created locally by this script and contains simple KEY=value lines.
. "$ENV_FILE"
set +a

ask_secret() {
  local key="$1"
  local prompt="$2"
  local value
  read -r -s -p "$prompt" value
  printf '\n'
  printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
}

ask_value() {
  local key="$1"
  local prompt="$2"
  local value
  read -r -p "$prompt" value
  printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
}

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  ask_secret OPENROUTER_API_KEY "OpenRouter API key: "
fi
if [ -z "${SLACK_BOT_TOKEN:-}" ]; then
  ask_secret SLACK_BOT_TOKEN "Slack bot token (xoxb-...): "
fi
if [ -z "${SLACK_SIGNING_SECRET:-}" ]; then
  ask_secret SLACK_SIGNING_SECRET "Slack signing secret: "
fi
if [ -z "${SLACK_APPROVAL_CHANNEL_ID:-}" ]; then
  ask_value SLACK_APPROVAL_CHANNEL_ID "Slack approval channel ID: "
fi

if ! grep -q '^APPROVAL_TIMEOUT_MS=' "$ENV_FILE"; then
  printf 'APPROVAL_TIMEOUT_MS=86400000\n' >> "$ENV_FILE"
fi
