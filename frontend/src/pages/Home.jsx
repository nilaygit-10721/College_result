import React from "react";

const Home = () => {
  return (
    <>
      <div className="h-screen bg-[#040D12]">
        <div className="flex">
          <h1 className="text-[#F3EEEA] font-semibold text-5xl mt-8 ml-8">
            College Result
          </h1>
        </div>
        <div className="flex mt-4 ml-8">
          <input
            type="text"
            placeholder="Enter URL"
            className="p-2 rounded border border-[#F3EEEA] bg-[#040D12] text-[#F3EEEA] w-64 mt-4"
          />
        </div>
      </div>
    </>
  );
};

export default Home;
