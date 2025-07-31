import React, { useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaCompress, FaExpand, FaPause, FaPlay } from "react-icons/fa";

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const carouselRef = useRef(null);

  const slides = [
    {
      id: 1,
      image: "/assets/images/banner4.png",
      title: "Discover Amazing Deals",
      subtitle: "Find your perfect items at unbeatable prices",
      description: "Join thousands of satisfied customers who found incredible deals on our platform",
      cta: "Shop Now",
      badge: "New"
    },
    {
      id: 2,
      image: "/assets/images/banner1.png",
      title: "Sustainable Shopping",
      subtitle: "Give pre-loved items a new life",
      description: "Reduce waste and save money while helping the environment",
      cta: "Explore Categories",
      badge: "Eco-Friendly"
    },
    {
      id: 3,
      image: "/assets/images/banner2.png",
      title: "Trusted Community",
      subtitle: "Buy and sell with confidence",
      description: "Verified sellers and secure transactions for peace of mind",
      cta: "Join Today",
      badge: "Verified"
    },
    {
      id: 4,
      image: "/assets/images/banner3.png",
      title: "Quality Guaranteed",
      subtitle: "Every item is carefully verified",
      description: "Our quality assurance team ensures only the best items reach you",
      cta: "Learn More",
      badge: "Premium"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      carouselRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'ArrowRight':
          nextSlide();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        nextSlide();
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSlide]);

  return (
    <div
      ref={carouselRef}
      className={`relative w-full overflow-hidden shadow-2xl transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-[500px] rounded-2xl'
        }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide
              ? 'opacity-100 translate-x-0 scale-100'
              : index < currentSlide
                ? 'opacity-0 -translate-x-full scale-95'
                : 'opacity-0 translate-x-full scale-95'
              }`}
          >
            <img
              src={slide.image}
              className="w-full h-full object-cover"
              alt={`Slide ${slide.id}`}
            />
            {/* Dynamic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="ml-8 md:ml-16 lg:ml-24 xl:ml-32 max-w-2xl px-4">
                {/* Badge */}
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-full mb-6 transform -translate-y-4 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                  {slide.badge}
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 leading-tight transform -translate-y-4 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                  {slide.title}
                </h2>

                {/* Subtitle */}
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-4 leading-relaxed transform -translate-y-4 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                  {slide.subtitle}
                </p>

                {/* Description */}
                <p className="text-sm md:text-base text-white/80 mb-8 leading-relaxed max-w-lg transform -translate-y-4 opacity-0 animate-fadeInUp" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                  {slide.description}
                </p>

                {/* CTA Button */}
                <button className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-full hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl transform -translate-y-4 opacity-0 animate-fadeInUp" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                  {slide.cta}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group z-10"
      >
        <FaChevronLeft className="text-lg md:text-xl group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group z-10"
      >
        <FaChevronRight className="text-lg md:text-xl group-hover:scale-110 transition-transform" />
      </button>

      {/* Control Panel */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 flex space-x-2 z-10">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
        >
          {isPlaying ? <FaPause className="text-sm md:text-lg" /> : <FaPlay className="text-sm md:text-lg" />}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
        >
          {isFullscreen ? <FaCompress className="text-sm md:text-lg" /> : <FaExpand className="text-sm md:text-lg" />}
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 md:space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${index === currentSlide
              ? 'bg-white scale-125 shadow-lg'
              : 'bg-white/50 hover:bg-white/75'
              }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-linear shadow-lg"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 md:top-6 left-4 md:left-6 px-3 md:px-4 py-1 md:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs md:text-sm font-medium z-10">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
        Use ← → keys to navigate
      </div>
    </div>
  );
};

export default Carousel;
