# Check the project, then publish the bundle to npm
publish:
    pnpm check
    cd dsh-snake && pnpm publish
