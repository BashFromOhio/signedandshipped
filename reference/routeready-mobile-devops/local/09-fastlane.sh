#!/usr/bin/env bash
# Level 09 · Run the SAME Fastlane lane CI runs, on your machine (MOB-103/108, Sprint 2-3).
# Gems install into vendor/bundle inside the repo (not system-wide). Ruby itself must already exist:
#   macOS: brew install ruby (or rbenv)   ·   Ubuntu/WSL: sudo apt-get install -y ruby-full build-essential
. "$(dirname "$0")/lib.sh"
banner "Level 09" "Run the CI lane locally with Fastlane" "MOB-103" "Sprint 2-3" "★★★☆☆"
command -v ruby >/dev/null || die "Ruby not found. See the install hint at the top of this script (docs/local/level-09.md)."
command -v bundle >/dev/null || gem install --user-install bundler
cd "$RR_ROOT"
step "Install fastlane into vendor/bundle (project-only)"
bundle config set --local path vendor/bundle
bundle install
[ -f Gemfile.lock ] && ok "Gemfile.lock written: commit it so CI installs the exact same versions"
step "fastlane android verify  (lint + unit tests + debug build, like PR CI)"
bundle exec fastlane android verify
if [ "$(rr_os)" = mac ] && [ -d apps/ios/RouteReady.xcodeproj ]; then
  step "fastlane ios verify (simulator, no signing)"
  bundle exec fastlane ios verify destination:"$(./scripts/pick-simulator.sh)" || warn "ios verify needs jq + an available simulator (Level 10)"
fi
done_level "level-09"
