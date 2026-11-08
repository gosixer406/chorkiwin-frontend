import { Swiper } from 'swiper/react';
import { useRef } from 'react';

import { Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// import { Pagination } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PosterSlider({ children, navBtnClass = '', pagination = false, autoPlay = true }) {
    const common_nav_class = `absolute ${pagination ? '-mt-2' : 'mt-0'} top-1/2 -translate-y-1/2 z-2 flex items-center justify-center p-0`;
    const swiperRef = useRef(null);
    const touchPointersRef = useRef(new Set());
    const prevSlide = () => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slidePrev();
        }
    };
    const nextSlide = () => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.slideNext();
        }
    };
    const allowNativePinch = (event) => {
        if (event.touches?.length > 1 && swiperRef.current?.swiper) {
            // Swiper calls preventDefault while it believes a banner is being
            // dragged. Disable only that drag for a two-finger gesture so the
            // mobile browser can zoom the entire page and the banner with it.
            swiperRef.current.swiper.allowTouchMove = false;
        }
    };
    const restoreBannerSwipe = (event) => {
        if (event.touches?.length === 0 && swiperRef.current?.swiper) {
            swiperRef.current.swiper.allowTouchMove = true;
        }
    };
    const trackTouchPointer = (event) => {
        if (event.pointerType !== 'touch') return;
        touchPointersRef.current.add(event.pointerId);
        if (touchPointersRef.current.size > 1 && swiperRef.current?.swiper) {
            swiperRef.current.swiper.allowTouchMove = false;
        }
    };
    const preservePointerPinch = (event) => {
        if (
            event.pointerType === 'touch'
            && touchPointersRef.current.size > 1
            && swiperRef.current?.swiper
        ) {
            swiperRef.current.swiper.allowTouchMove = false;
        }
    };
    const releaseTouchPointer = (event) => {
        if (event.pointerType !== 'touch') return;
        touchPointersRef.current.delete(event.pointerId);
        if (touchPointersRef.current.size < 2 && swiperRef.current?.swiper) {
            // Restore after the current pointer event has reached Swiper, so
            // the end of a pinch cannot be misread as a horizontal slide.
            window.setTimeout(() => {
                if (touchPointersRef.current.size < 2 && swiperRef.current?.swiper) {
                    swiperRef.current.swiper.allowTouchMove = true;
                }
            }, 0);
        }
    };

    return (
        <div
            className={`velki-zoomable-banner relative z-1 overflow-hidden ${pagination ? 'pb-4' : 'pb-0'}`}
            onTouchStartCapture={allowNativePinch}
            onTouchMoveCapture={allowNativePinch}
            onTouchEndCapture={restoreBannerSwipe}
            onTouchCancelCapture={restoreBannerSwipe}
            onPointerDownCapture={trackTouchPointer}
            onPointerMoveCapture={preservePointerPinch}
            onPointerUpCapture={releaseTouchPointer}
            onPointerCancelCapture={releaseTouchPointer}
        >
            <Swiper
                className="poster-slider"
                slidesPerView={1}
                spaceBetween={0}
                centeredSlides={false}
                pagination={pagination}
                grabCursor={true}
                touchStartPreventDefault={false}
                touchMoveStopPropagation={false}
                loop={true}
                autoplay={autoPlay ? {
                    delay: 3000,
                    disableOnInteraction: false,
                } : false}
                ref={swiperRef}
                modules={[Pagination, Autoplay]}
            >
                {children}
            </Swiper>
            <button type="button" className={`${common_nav_class} left-1 ${navBtnClass}`} title="Previous slide" aria-label="Previous slide" onClick={prevSlide}>
                <ChevronLeft className='text-white size-5' />
            </button>
            <button type="button" className={`${common_nav_class} right-1 ${navBtnClass}`} title="Next slide" aria-label="Next slide" onClick={nextSlide}>
                <ChevronRight className='text-white size-5' />
            </button>
        </div >
    )
}
