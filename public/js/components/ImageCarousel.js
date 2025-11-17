/**
 * ImageCarousel Component
 * Swipeable image carousel for auction items
 */

const { useState, useEffect, useRef } = React;

/**
 * Image carousel with touch swipe support
 * @param {Object} props - Component props
 * @param {Array<string>} props.images - Array of image URLs
 * @param {string} props.alt - Alt text for images
 * @returns {JSX.Element} Image carousel
 */
export function ImageCarousel({ images = [], alt = 'Auction item' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const carouselRef = useRef(null);

  // Minimum swipe distance (in px) to trigger slide change
  const minSwipeDistance = 50;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  if (!images || images.length === 0) {
    return html`
      <div class="image-carousel image-carousel--empty">
        <div class="image-carousel__placeholder">
          <span>No images available</span>
        </div>
      </div>
    `;
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Touch event handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    // Reset
    setTouchStart(null);
    setTouchEnd(null);
  };

  const showNavigation = images.length > 1;

  return html`
    <div class="image-carousel" ref=${carouselRef}>

      <!-- Main Image -->
      <div
        class="image-carousel__main"
        onTouchStart=${onTouchStart}
        onTouchMove=${onTouchMove}
        onTouchEnd=${onTouchEnd}
      >
        <img
          src=${images[currentIndex]}
          alt="${alt} - Image ${currentIndex + 1} of ${images.length}"
          class="image-carousel__image"
          loading="lazy"
        />

        <!-- Navigation Arrows -->
        ${showNavigation && html`
          <>
            <button
              class="image-carousel__nav image-carousel__nav--prev"
              onClick=${goToPrevious}
              aria-label="Previous image"
              type="button"
            >
              ‹
            </button>

            <button
              class="image-carousel__nav image-carousel__nav--next"
              onClick=${goToNext}
              aria-label="Next image"
              type="button"
            >
              ›
            </button>
          </>
        `}

        <!-- Image Counter -->
        ${showNavigation && html`
          <div class="image-carousel__counter">
            ${currentIndex + 1} / ${images.length}
          </div>
        `}
      </div>

      <!-- Thumbnail Dots -->
      ${showNavigation && html`
        <div class="image-carousel__dots">
          ${images.map((_, index) => html`
            <button
              key=${index}
              class="image-carousel__dot ${index === currentIndex ? 'image-carousel__dot--active' : ''}"
              onClick=${() => goToSlide(index)}
              aria-label="Go to image ${index + 1}"
              aria-current=${index === currentIndex ? 'true' : 'false'}
              type="button"
            />
          `)}
        </div>
      `}
    </div>
  `;
}
