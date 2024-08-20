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
            type="url"
            placeholder="Enter URL"
            className="p-2 rounded border border-[#F3EEEA] bg-[#040D12] text-[#F3EEEA] w-[50rem] mt-2 px-2"
          />
          <button className="bg-transparent  hover:bg-blue-500 ml-5 text-blue-700 font-semibold hover:text-white px-1 py-1  border border-blue-500 hover:border-transparent rounded">
            Submit
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
