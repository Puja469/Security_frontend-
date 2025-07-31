import React from "react";

const Banner = () => {
  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96">
      <img
        src="/assets/images/banner2.png"
        alt="Banner"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <h1 className="text-white text-2xl md:text-4xl font-bold text-center">
          Welcome to Thrift Store Nepal
        </h1>
      </div>
    </div>
  );
};

export default Banner;
