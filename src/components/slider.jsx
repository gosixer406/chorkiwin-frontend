import { Swiper, SwiperSlide } from 'swiper/react';
import React, { useState, useEffect, useRef } from 'react';
import {FaArrowLeft, FaArrowRight} from 'react-icons/fa'

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { Pagination } from 'swiper/modules';


export default function Slider() {
    const [isPrevSlide, setIsPrevSlide] = useState(true);
    const [isNextSlide, setIsNextSlide] = useState(false);
    const swiperRef = useRef(null);
    useEffect(() => {
        const swiperInstance = swiperRef.current?.swiper;
        if (swiperInstance) {
            setIsPrevSlide(swiperInstance.isBeginning);
            setIsNextSlide(swiperInstance.isEnd);
        }
    }, []);
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
    const handleSlideChange = () => {
        const swiperInstance = swiperRef.current?.swiper;
        if (swiperInstance) {
            setIsPrevSlide(swiperInstance.isBeginning);
            setIsNextSlide(swiperInstance.isEnd);
        }
    };
    return (
        <div>
            <Swiper
                className='testimonial-slider'
                breakpoints={{
                    0: {
                        slidesPerView: 1,
                        spaceBetween: 20,
                    },
                    481: {
                        slidesPerView: 1,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    992: {
                        slidesPerView: 3,
                        spaceBetween: 24,
                    }
                }}
                centeredSlides={false}
                pagination={false}
                grabCursor={true}
                loop={true}
                onSlideChange={handleSlideChange}
                ref={swiperRef}
                modules={[Pagination]}
            >
                <SwiperSlide>
                    <h1>Lorem ipsum dolor sit amet.</h1>
                </SwiperSlide>
                <SwiperSlide>
                    <h1>Lorem ipsum dolor sit amet.</h1>
                </SwiperSlide>
                <SwiperSlide>
                    <h1>Lorem ipsum dolor sit amet.</h1>
                </SwiperSlide>
                <SwiperSlide>
                    <h1>Lorem ipsum dolor sit amet.</h1>
                </SwiperSlide>
                <SwiperSlide>
                    <h1>Lorem ipsum dolor sit amet.</h1>
                </SwiperSlide>
            </Swiper>
            <div className="swiper-nav flex items-center justify-center gap-3">
                <button className="flex items-center justify-center p-0" title='previous' onClick={prevSlide}>
                    <FaArrowLeft />
                </button>
                <button className="flex items-center justify-center p-0" title='previous' onClick={nextSlide}>
                    <FaArrowRight />
                </button>
            </div>
        </div>
    )
}
