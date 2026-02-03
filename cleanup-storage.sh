#!/bin/bash

# Storage Cleanup Script for LMS Platform
# This script safely cleans up Docker and cache files to free disk space

set -e

echo "=========================================="
echo "Storage Cleanup Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check current disk usage
echo -e "${YELLOW}Current disk usage:${NC}"
df -h / | tail -1
echo ""

# Check Docker usage
echo -e "${YELLOW}Docker disk usage:${NC}"
docker system df
echo ""

# Step 1: Clean Docker resources
echo -e "${GREEN}Step 1: Cleaning Docker resources...${NC}"
echo "  - Removing unused containers..."
docker container prune -f

echo "  - Removing unused images..."
docker image prune -a -f

echo "  - Removing unused volumes..."
docker volume prune -f

echo "  - Removing build cache..."
docker builder prune -a -f

echo "  - Removing unused networks..."
docker network prune -f

echo ""

# Step 2: Clean npm/pnpm cache
echo -e "${GREEN}Step 2: Cleaning package manager caches...${NC}"
if [ -d ~/.npm ]; then
    echo "  - Cleaning npm cache (~/.npm)..."
    npm cache clean --force 2>/dev/null || rm -rf ~/.npm/_cacache
    echo "  - Freed: $(du -sh ~/.npm 2>/dev/null | cut -f1)"
fi

if [ -d ~/.cache/pnpm ]; then
    echo "  - Cleaning pnpm cache..."
    pnpm store prune 2>/dev/null || rm -rf ~/.cache/pnpm/store
    echo "  - Freed: $(du -sh ~/.cache/pnpm 2>/dev/null | cut -f1)"
fi

echo ""

# Step 3: Clean other caches
echo -e "${GREEN}Step 3: Cleaning other caches...${NC}"

# Clean pip cache
if [ -d ~/.cache/pip ]; then
    echo "  - Cleaning pip cache..."
    pip cache purge 2>/dev/null || rm -rf ~/.cache/pip
fi

# Clean Prisma cache
if [ -d ~/.cache/prisma ]; then
    echo "  - Cleaning Prisma cache..."
    rm -rf ~/.cache/prisma
fi

# Clean Playwright cache (if not needed)
if [ -d ~/.cache/ms-playwright ]; then
    echo "  - Playwright cache: $(du -sh ~/.cache/ms-playwright | cut -f1)"
    read -p "  - Remove Playwright cache? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf ~/.cache/ms-playwright
        echo "  - Playwright cache removed"
    fi
fi

# Clean JetBrains cache
if [ -d ~/.cache/JetBrains ]; then
    echo "  - JetBrains cache: $(du -sh ~/.cache/JetBrains | cut -f1)"
    read -p "  - Remove JetBrains cache? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf ~/.cache/JetBrains
        echo "  - JetBrains cache removed"
    fi
fi

echo ""

# Step 4: Check Docker Desktop VM size
echo -e "${GREEN}Step 4: Checking Docker Desktop VM...${NC}"
VM_SIZE=$(du -sh ~/.docker/desktop/vms/0 2>/dev/null | cut -f1 || echo "N/A")
echo "  - Docker Desktop VM size: ${VM_SIZE}"

if [ -f ~/.docker/desktop/vms/0/data/Docker.raw ]; then
    RAW_SIZE=$(du -sh ~/.docker/desktop/vms/0/data/Docker.raw 2>/dev/null | cut -f1 || echo "N/A")
    echo "  - Docker.raw file size: ${RAW_SIZE}"
    echo ""
    echo -e "${YELLOW}Note: To compact the Docker Desktop VM disk:${NC}"
    echo "  1. Stop Docker Desktop"
    echo "  2. Run: qemu-img convert -O qcow2 ~/.docker/desktop/vms/0/data/Docker.raw ~/.docker/desktop/vms/0/data/Docker.raw.new"
    echo "  3. Replace the old file with the new one"
    echo "  4. Start Docker Desktop"
    echo ""
    echo -e "${YELLOW}Or use Docker Desktop's built-in disk compaction:${NC}"
    echo "  Docker Desktop > Settings > Resources > Advanced > Disk image size > Compact"
fi

echo ""

# Final disk usage
echo -e "${GREEN}Final disk usage:${NC}"
df -h / | tail -1
echo ""

echo -e "${GREEN}Docker disk usage after cleanup:${NC}"
docker system df
echo ""

echo -e "${GREEN}Cleanup complete!${NC}"
echo ""
echo "If you need more space, consider:"
echo "  - Compacting Docker Desktop VM (see instructions above)"
echo "  - Removing old logs: journalctl --vacuum-time=7d"
echo "  - Cleaning snap packages: sudo snap list && sudo snap remove <package>"






