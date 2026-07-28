# Project Rules - Avadhanula Stores

## FTP Deployment Path
- **Crucial**: The live public storefront website for the custom domain `avadhanulastores.shop` must be deployed to the FTP subdirectory `avadhanulastores.shop/htdocs/` rather than the default root `htdocs/` folder on InfinityFree.
- Ensure that the GitHub Actions deployment workflow `.github/workflows/deploy.yml` always sets `server-dir: avadhanulastores.shop/htdocs/`.
