#!/bin/sh
set -eu

COMMON_URL_DEFAULT="https://github.com/ormastes/Spipe.git"
MODE=""
DESTINATION=""
COMMON_URL="$COMMON_URL_DEFAULT"
ORGANIZATION=""
PROJECT=""
YES=0

usage() {
  cat <<'USAGE'
Usage: setup-local-knowledge.sh [--mode user|project] [--destination PATH]
       [--common-url URL] [--organization UID] [--project UID] [--yes]

Creates a user-owned SPipe repository or finishes setup in a cloned project.
Interactive prompts are used only when stdin is a terminal and a value is absent.
USAGE
}

prompt() {
  label="$1" default="$2"
  if [ ! -t 0 ]; then printf '%s\n' "$default"; return; fi
  printf '%s [%s]: ' "$label" "$default" >&2
  IFS= read -r answer || exit 130
  if [ -n "$answer" ]; then printf '%s\n' "$answer"; else printf '%s\n' "$default"; fi
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode) shift; MODE="${1:-}" ;;
    --destination) shift; DESTINATION="${1:-}" ;;
    --common-url) shift; COMMON_URL="${1:-}" ;;
    --organization) shift; ORGANIZATION="${1:-}" ;;
    --project) shift; PROJECT="${1:-}" ;;
    --yes) YES=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "setup-local-knowledge: unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

MODE="${MODE:-$(prompt "Setup mode (user/project)" user)}"
case "$MODE" in
  user) DESTINATION="${DESTINATION:-$(prompt "User SPipe repository" "$HOME/.spipe")}" ;;
  project) DESTINATION="${DESTINATION:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}" ;;
  *) echo "setup-local-knowledge: mode must be user or project" >&2; exit 2 ;;
esac

case "$DESTINATION" in /) echo "setup-local-knowledge: refusing filesystem root" >&2; exit 2 ;; esac

validate_uid() {
  newline='
'
  carriage_return="$(printf '\r')"
  case "$2" in
    *'|'*|*"$newline"*|*"$carriage_return"*)
      echo "setup-local-knowledge: $1 UID contains a registry delimiter" >&2
      exit 2
      ;;
  esac
}
validate_uid organization "$ORGANIZATION"
validate_uid project "$PROJECT"

if [ "$MODE" = user ]; then
  mkdir -p "$DESTINATION"
  if [ ! -d "$DESTINATION/.git" ]; then git -C "$DESTINATION" init >/dev/null; fi
  common_path="$DESTINATION/.spipe"
  mkdir -p "$DESTINATION/organization" "$DESTINATION/projects" "$DESTINATION/local"
  if [ ! -e "$DESTINATION/.gitignore" ]; then
    printf 'local/\n' > "$DESTINATION/.gitignore"
  elif ! grep -Fqx 'local/' "$DESTINATION/.gitignore"; then
    printf '\nlocal/\n' >> "$DESTINATION/.gitignore"
  fi
  if [ ! -e "$common_path" ]; then
    git -C "$DESTINATION" submodule add "$COMMON_URL" .spipe
  elif ! git -C "$DESTINATION" ls-files --stage -- .spipe | grep -q '^160000 '; then
    echo "setup-local-knowledge: occupied non-submodule target: $common_path" >&2; exit 3
  fi
else
  if [ ! -d "$DESTINATION/.git" ] && ! git -C "$DESTINATION" rev-parse --git-dir >/dev/null 2>&1; then
    echo "setup-local-knowledge: project destination is not a Git checkout" >&2; exit 3
  fi
  if [ -f "$DESTINATION/.spipe/common/package.json" ] &&
     grep -Eq '"name"[[:space:]]*:[[:space:]]*"@simple-lang/spipe"' "$DESTINATION/.spipe/common/package.json"; then
    echo "common_layout=.spipe/common (external canonical checkout)"
  elif git -C "$DESTINATION" ls-files --stage -- .spipe | grep -q '^160000 '; then
    git -C "$DESTINATION" submodule update --init -- .spipe
  elif git -C "$DESTINATION" ls-files --stage -- .spipe/spipe | grep -q '^160000 '; then
    git -C "$DESTINATION" submodule update --init -- .spipe/spipe
    echo "legacy_layout=.spipe/spipe (preserved; migration requires a reviewed plan)"
  else
    echo "setup-local-knowledge: project has no .spipe/common route or recorded legacy submodule" >&2; exit 3
  fi
fi

registry="$DESTINATION/local/scopes.sdn"
if [ "$MODE" = project ]; then registry="${XDG_CONFIG_HOME:-$HOME/.config}/spipe/scopes.sdn"; fi
mkdir -p "$(dirname "$registry")"
if [ ! -e "$registry" ]; then
  umask 077
  printf '# machine-local SPipe scope mounts\n' > "$registry"
fi
if [ -n "$ORGANIZATION" ] && ! grep -Fq "organization:$ORGANIZATION|" "$registry"; then
  printf 'organization:%s|%s/organization/%s\n' "$ORGANIZATION" "$DESTINATION" "$ORGANIZATION" >> "$registry"
fi
if [ -n "$PROJECT" ] && ! grep -Fq "project:$PROJECT|" "$registry"; then
  printf 'project:%s|%s\n' "$PROJECT" "$DESTINATION" >> "$registry"
fi

echo "mode=$MODE"
echo "destination=$DESTINATION"
echo "registry=$registry"
echo "status=ready"
