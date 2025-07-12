#!/usr/bin/env bash
set -euo pipefail

# Configuration
IMAGE_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_NAMESPACE="${DOCKER_NAMESPACE:-staka}"
IMAGE_FRONTEND="${IMAGE_REGISTRY}/${IMAGE_NAMESPACE}/livres-frontend"
IMAGE_BACKEND="${IMAGE_REGISTRY}/${IMAGE_NAMESPACE}/livres-backend"

# Default values
TAG="${1:-latest}"
PUSH="${PUSH:-false}"
PLATFORM="${PLATFORM:-linux/amd64,linux/arm64}"
TARGET="${TARGET:-all}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Usage: $0 [TAG] [OPTIONS]

Build and optionally push Docker images for Staka Livres.

Arguments:
    TAG                 Docker tag to use (default: latest)

Options:
    --push              Push images to registry
    --no-push           Don't push images (default)
    --platform PLATFORMS Platform(s) to build for (default: linux/amd64,linux/arm64)
    --target TARGET     Build target: frontend, backend, or all (default: all)
    --registry REGISTRY Docker registry (default: ghcr.io)
    --namespace NS      Docker namespace (default: staka)
    --help              Show this help message

Environment variables:
    DOCKER_REGISTRY     Override default registry
    DOCKER_NAMESPACE    Override default namespace
    PUSH                Set to 'true' to push images

Examples:
    $0                          # Build latest images locally
    $0 1.2.0 --push            # Build and push version 1.2.0
    $0 dev --target frontend   # Build only frontend with dev tag
    PUSH=true $0 v1.0.0         # Build and push using environment variable

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --push)
            PUSH=true
            shift
            ;;
        --no-push)
            PUSH=false
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --target)
            TARGET="$2"
            shift 2
            ;;
        --registry)
            IMAGE_REGISTRY="$2"
            # Update image names
            IMAGE_FRONTEND="${IMAGE_REGISTRY}/${IMAGE_NAMESPACE}/livres-frontend"
            IMAGE_BACKEND="${IMAGE_REGISTRY}/${IMAGE_NAMESPACE}/livres-backend"
            shift 2
            ;;
        --namespace)
            IMAGE_NAMESPACE="$2"
            # Update image names
            IMAGE_FRONTEND="${IMAGE_REGISTRY}/${IMAGE_NAMESPACE}/livres-frontend"
            IMAGE_BACKEND="${IMAGE_REGISTRY}/${IMAGE_NAMESPACE}/livres-backend"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option $1"
            show_help
            exit 1
            ;;
        *)
            TAG="$1"
            shift
            ;;
    esac
done

# Validation
if [[ ! "$TARGET" =~ ^(frontend|backend|all)$ ]]; then
    log_error "Invalid target: $TARGET. Must be 'frontend', 'backend', or 'all'"
    exit 1
fi

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "frontend" ]] || [[ ! -d "backend" ]]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

# Check if Docker buildx is available
if ! docker buildx version &> /dev/null; then
    log_error "Docker buildx is required but not available"
    exit 1
fi

# Create or use existing buildx builder
log_info "Setting up Docker buildx builder..."
BUILDER_NAME="staka-builder"

if ! docker buildx inspect "$BUILDER_NAME" &> /dev/null; then
    log_info "Creating new buildx builder: $BUILDER_NAME"
    docker buildx create --name "$BUILDER_NAME" --driver docker-container --use
else
    log_info "Using existing buildx builder: $BUILDER_NAME"
    docker buildx use "$BUILDER_NAME"
fi

# Build function
build_image() {
    local service=$1
    local dockerfile=$2
    local context=$3
    local image_name=$4
    
    log_info "Building $service image: $image_name:$TAG"
    log_info "Platform(s): $PLATFORM"
    log_info "Context: $context"
    log_info "Dockerfile: $dockerfile"
    
    local build_args=(
        "buildx" "build"
        "--platform" "$PLATFORM"
        "-t" "$image_name:$TAG"
        "-f" "$dockerfile"
    )
    
    # Add latest tag if not building latest
    if [[ "$TAG" != "latest" ]]; then
        build_args+=("-t" "$image_name:latest")
    fi
    
    # Add push flag if requested
    if [[ "$PUSH" == "true" ]]; then
        build_args+=("--push")
        log_info "Images will be pushed to registry"
    else
        build_args+=("--load")
        log_info "Images will be loaded locally"
    fi
    
    # Add context
    build_args+=("$context")
    
    # Execute build
    if docker "${build_args[@]}"; then
        log_success "$service image built successfully"
        if [[ "$PUSH" == "true" ]]; then
            log_success "$service image pushed to registry"
        fi
    else
        log_error "Failed to build $service image"
        return 1
    fi
}

# Main build process
log_info "Starting Docker build process..."
log_info "Tag: $TAG"
log_info "Target: $TARGET"
log_info "Push: $PUSH"

BUILD_SUCCESS=true

# Build frontend
if [[ "$TARGET" == "frontend" ]] || [[ "$TARGET" == "all" ]]; then
    if ! build_image "frontend" "frontend/Dockerfile" "." "$IMAGE_FRONTEND"; then
        BUILD_SUCCESS=false
    fi
fi

# Build backend
if [[ "$TARGET" == "backend" ]] || [[ "$TARGET" == "all" ]]; then
    if ! build_image "backend" "backend/Dockerfile" "." "$IMAGE_BACKEND"; then
        BUILD_SUCCESS=false
    fi
fi

# Final status
if [[ "$BUILD_SUCCESS" == "true" ]]; then
    log_success "All builds completed successfully!"
    
    if [[ "$PUSH" == "true" ]]; then
        log_success "Images are now available in the registry:"
        if [[ "$TARGET" == "frontend" ]] || [[ "$TARGET" == "all" ]]; then
            echo "  - $IMAGE_FRONTEND:$TAG"
        fi
        if [[ "$TARGET" == "backend" ]] || [[ "$TARGET" == "all" ]]; then
            echo "  - $IMAGE_BACKEND:$TAG"
        fi
    else
        log_success "Images are now available locally:"
        if [[ "$TARGET" == "frontend" ]] || [[ "$TARGET" == "all" ]]; then
            echo "  - $IMAGE_FRONTEND:$TAG"
        fi
        if [[ "$TARGET" == "backend" ]] || [[ "$TARGET" == "all" ]]; then
            echo "  - $IMAGE_BACKEND:$TAG"
        fi
    fi
else
    log_error "Some builds failed. Check the output above for details."
    exit 1
fi