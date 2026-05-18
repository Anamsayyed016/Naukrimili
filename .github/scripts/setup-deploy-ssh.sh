#!/usr/bin/env bash
# Write and validate GitHub Actions SSH_KEY secret → ~/.ssh/deploy_key
set -euo pipefail

KEY_FILE="${1:-$HOME/.ssh/deploy_key}"
KEY_DIR="$(dirname "$KEY_FILE")"

mkdir -p "$KEY_DIR"
chmod 700 "$KEY_DIR"

if [ -z "${SSH_KEY:-}" ]; then
  echo "❌ SSH_KEY is empty (set repository secret SSH_KEY)"
  exit 1
fi

# Strip wrapping quotes sometimes pasted into GitHub Secrets UI
RAW="$SSH_KEY"
while [ "${#RAW}" -gt 0 ]; do
  case "$RAW" in
    \"*\" ) RAW="${RAW:1:${#RAW}-2}" ;;
    \'*\' ) RAW="${RAW:1:${#RAW}-2}" ;;
    * ) break ;;
  esac
done

# Normalize newlines: literal \n, CRLF, or real multiline from secret
if printf '%s' "$RAW" | grep -q '\\n'; then
  printf '%b' "$(printf '%s' "$RAW" | sed 's/\\n/\n/g')" > "$KEY_FILE"
else
  printf '%s' "$RAW" > "$KEY_FILE"
  # Ensure trailing newline (required by OpenSSH)
  [ -n "$RAW" ] && [ "${RAW: -1}" != $'\n' ] && printf '\n' >> "$KEY_FILE"
fi

# Remove Windows CRLF and stray carriage returns
if command -v dos2unix >/dev/null 2>&1; then
  dos2unix "$KEY_FILE" 2>/dev/null || true
else
  sed -i 's/\r$//' "$KEY_FILE" 2>/dev/null || sed -i '' 's/\r$//' "$KEY_FILE" 2>/dev/null || true
fi

chmod 600 "$KEY_FILE"

# Validate PEM / OpenSSH private key markers
if ! grep -qE 'BEGIN (OPENSSH |RSA |EC |DSA )?PRIVATE KEY' "$KEY_FILE"; then
  echo "❌ Invalid SSH key: missing BEGIN PRIVATE KEY marker"
  echo "   First 80 chars: $(head -c 80 "$KEY_FILE" | tr '\n' ' ')"
  echo "   File size: $(wc -c < "$KEY_FILE") bytes"
  echo ""
  echo "   Fix: GitHub → Settings → Secrets → SSH_KEY"
  echo "   Paste the FULL private key file including BEGIN/END lines."
  echo "   Do not paste only the public key or a fingerprint."
  exit 1
fi

if ! grep -qE 'END (OPENSSH |RSA |EC |DSA )?PRIVATE KEY' "$KEY_FILE"; then
  echo "❌ SSH key missing END PRIVATE KEY marker"
  echo "   Last 80 chars: $(tail -c 80 "$KEY_FILE" | tr '\n' ' ')"
  exit 1
fi

# Cryptographic parse check
if command -v ssh-keygen >/dev/null 2>&1; then
  if ! ssh-keygen -y -f "$KEY_FILE" >/dev/null 2>&1; then
    echo "❌ ssh-keygen could not read this key (truncated, wrong format, or passphrase-protected)"
    echo "   Use an unencrypted deploy key: ssh-keygen -t ed25519 -N \"\" -f deploy_key"
    exit 1
  fi
  FINGERPRINT=$(ssh-keygen -lf "$KEY_FILE" 2>/dev/null | awk '{print $2}')
  echo "✅ SSH key valid ($(wc -c < "$KEY_FILE") bytes, fingerprint: ${FINGERPRINT:-unknown})"
else
  echo "✅ SSH key markers valid ($(wc -c < "$KEY_FILE") bytes)"
fi
