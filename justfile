# List recipes
default:
    @just --list --unsorted

# Install dependencies
install:
    pnpm install

# Write dsh-snake/client.js
build: install
    pnpm build

# Rebuild on change
watch: install
    pnpm watch

# Run all tests against a fresh build
test: build
    pnpm test

# Build, syntax-check the bundle and run all tests
check: install
    pnpm check

# Check the project, then publish the bundle to npm
publish: check
    cd dsh-snake && pnpm publish
