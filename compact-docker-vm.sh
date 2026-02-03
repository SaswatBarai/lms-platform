#!/bin/bash

# Docker Desktop VM Compaction Script
# This script helps compact the Docker Desktop VM disk to free up space
# WARNING: This requires stopping Docker Desktop

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Docker Desktop VM Compaction Guide${NC}"
echo "=========================================="
echo ""

# Check if Docker Desktop is running
if pgrep -f "docker-desktop" > /dev/null; then
    echo -e "${RED}Docker Desktop is currently running!${NC}"
    echo ""
    echo "To compact the VM disk, you need to:"
    echo "  1. Stop Docker Desktop completely"
    echo "  2. Run this script again"
    echo ""
    echo "Or use Docker Desktop's built-in compaction:"
    echo "  Docker Desktop > Settings > Resources > Advanced > Disk image size > Compact"
    echo ""
    exit 1
fi

VM_PATH="$HOME/.docker/desktop/vms/0/data/Docker.raw"
BACKUP_PATH="$HOME/.docker/desktop/vms/0/data/Docker.raw.backup"

if [ ! -f "$VM_PATH" ]; then
    echo -e "${RED}VM disk file not found at: $VM_PATH${NC}"
    exit 1
fi

# Check current size
CURRENT_SIZE=$(du -h "$VM_PATH" | cut -f1)
echo -e "${YELLOW}Current VM disk size: ${CURRENT_SIZE}${NC}"
echo ""

# Check if qemu-img is available
if ! command -v qemu-img &> /dev/null; then
    echo -e "${YELLOW}qemu-img not found. Installing...${NC}"
    echo "Please install qemu-utils:"
    echo "  sudo apt-get update && sudo apt-get install -y qemu-utils"
    exit 1
fi

echo -e "${YELLOW}This will:${NC}"
echo "  1. Create a backup of the current VM disk"
echo "  2. Compact the VM disk"
echo "  3. Replace the old disk with the compacted one"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${GREEN}Step 1: Creating backup...${NC}"
cp "$VM_PATH" "$BACKUP_PATH"
echo "Backup created at: $BACKUP_PATH"

echo ""
echo -e "${GREEN}Step 2: Compacting VM disk...${NC}"
echo "This may take several minutes..."
qemu-img convert -O qcow2 "$VM_PATH" "${VM_PATH}.new"

echo ""
echo -e "${GREEN}Step 3: Replacing old disk with compacted version...${NC}"
mv "${VM_PATH}.new" "$VM_PATH"

echo ""
echo -e "${GREEN}Step 4: Checking new size...${NC}"
NEW_SIZE=$(du -h "$VM_PATH" | cut -f1)
echo -e "${GREEN}New VM disk size: ${NEW_SIZE}${NC}"
echo ""

# Calculate space saved
OLD_SIZE_BYTES=$(stat -c%s "$BACKUP_PATH" 2>/dev/null || echo "0")
NEW_SIZE_BYTES=$(stat -c%s "$VM_PATH" 2>/dev/null || echo "0")
SAVED_BYTES=$((OLD_SIZE_BYTES - NEW_SIZE_BYTES))
SAVED_GB=$((SAVED_BYTES / 1024 / 1024 / 1024))

if [ $SAVED_GB -gt 0 ]; then
    echo -e "${GREEN}Space saved: ~${SAVED_GB}GB${NC}"
else
    echo -e "${YELLOW}No significant space saved (disk may already be compact)${NC}"
fi

echo ""
echo -e "${GREEN}Compaction complete!${NC}"
echo ""
echo "You can now start Docker Desktop."
echo ""
echo -e "${YELLOW}Note:${NC} The backup is at $BACKUP_PATH"
echo "You can remove it after verifying Docker Desktop works correctly:"
echo "  rm $BACKUP_PATH"






